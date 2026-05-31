const STORAGE_KEY = "rainOrShineBirdingData";
const BADGE_STORAGE_KEY = "rainOrShineMilestoneBadges";
const SESSION_STORAGE_KEY = "rainOrShineSupabaseSession";
const defaultMembers = ["Jeff", "Alex", "Matt"];
const teamSpeciesMembers = ["Alex", "Jeff", "Matt"];
const emailMemberMap = {
  "rmphilli@gmail.com": "Matt",
};
const memberColors = {
  Matt: "#c75b57",
  Jeff: "#3f7f99",
  Alex: "#6f8f4e",
};
const memberColorClasses = {
  Matt: "matt",
  Jeff: "jeff",
  Alex: "alex",
};

let observations = loadObservations();
let userMilestoneBadges = loadMilestoneBadgeStore();
let appConfig = { supabaseUrl: "", supabaseAnonKey: "" };
let authSession = loadAuthSession();
let isRemoteReady = false;

const fileInputs = document.querySelectorAll(".file-input");
const speciesTable = document.querySelector("#speciesTable");
const tableEmpty = document.querySelector("#tableEmpty");
const teamSpeciesTable = document.querySelector("#teamSpeciesTable");
const teamSpeciesEmpty = document.querySelector("#teamSpeciesEmpty");
const mapEmpty = document.querySelector("#mapEmpty");
const mapContainer = document.querySelector("#birdMap");
const memberFilter = document.querySelector("#memberFilter");
const speciesSearch = document.querySelector("#speciesSearch");
const memberBreakdown = document.querySelector("#memberBreakdown");
const profileTrophyCase = document.querySelector("#profileTrophyCase");
const birderTypeBadges = document.querySelector("#birderTypeBadges");
const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const assistantStatus = document.querySelector("#assistantStatus");
const birdImageInput = document.querySelector("#birdImageInput");
const imagePreview = document.querySelector("#imagePreview");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authStatus = document.querySelector("#authStatus");
const signOutButton = document.querySelector("#signOutButton");
const syncStatus = document.querySelector("#syncStatus");
const welcomeMessage = document.querySelector("#welcomeMessage");
const whimsyTitle = document.querySelector("#whimsyTitle");
const whimsyText = document.querySelector("#whimsyText");
const whimsyMeta = document.querySelector("#whimsyMeta");

let attachedBirdImage = null;
let birdMap = null;
let birdMapLayer = null;

const aliases = {
  species: ["commonname", "common name", "species", "englishname", "english name"],
  scientific: ["scientificname", "scientific name", "latinname", "latin name"],
  date: ["date", "observationdate", "observation date", "obsdate"],
  count: ["count", "number", "howmany"],
  latitude: ["latitude", "lat", "decimal latitude"],
  longitude: ["longitude", "lng", "lon", "decimal longitude"],
  location: ["location", "locality", "locationname", "location name", "hotspot", "site"],
  checklist: ["submissionid", "submission id", "checklistid", "checklist id", "samplingeventidentifier"],
};

function normalizeMemberName(member) {
  const normalized = String(member || "").trim().toLowerCase();
  return defaultMembers.find((name) => name.toLowerCase() === normalized) || String(member || "").trim();
}

function getMemberColor(member) {
  return memberColors[normalizeMemberName(member)] || "#506f55";
}

function getMemberColorClass(member) {
  return memberColorClasses[normalizeMemberName(member)] || "default";
}

fileInputs.forEach((input) => {
  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    const member = normalizeMemberName(event.target.dataset.member);
    const imported = normalizeRows(rows, member, file.name);

    observations = observations.filter((item) => normalizeMemberName(item.member) !== member).concat(imported);
    await saveImport(member, file.name, imported);
    event.target.closest(".upload-card").querySelector(".upload-card__hint").textContent = `${imported.length} rows`;
    render();
  });
});

document.querySelector("#resetData").addEventListener("click", async () => {
  observations = [];
  userMilestoneBadges = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BADGE_STORAGE_KEY);
  if (isRemoteReady) {
    await remoteDelete("user_milestone_badges");
    await remoteDelete("observations");
    await remoteDelete("imports");
  }
  fileInputs.forEach((input) => {
    input.value = "";
    input.closest(".upload-card").querySelector(".upload-card__hint").textContent = "Choose CSV";
  });
  render();
});

memberFilter.addEventListener("change", renderMap);
speciesSearch.addEventListener("input", renderSpeciesTable);
window.addEventListener("resize", renderMap);
setupChatAssistant();
setupAuth();
initRemoteData();
renderWhimsyWatch();

render();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((cells) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = (cells[index] || "").trim();
    });
    return entry;
  });
}

function normalizeRows(rows, member, sourceName) {
  const cleanMember = normalizeMemberName(member);
  return rows
    .map((row, index) => {
      const species = pick(row, aliases.species);
      if (!species) return null;

      return {
        id: `${cleanMember}-${sourceName}-${index}-${species}`,
        member: cleanMember,
        species: titleCase(species),
        scientific: pick(row, aliases.scientific),
        date: cleanDate(pick(row, aliases.date)),
        count: pick(row, aliases.count) || "",
        latitude: parseNumber(pick(row, aliases.latitude)),
        longitude: parseNumber(pick(row, aliases.longitude)),
        location: pick(row, aliases.location) || "Unlisted place",
        checklist: pick(row, aliases.checklist),
        sourceName,
      };
    })
    .filter(Boolean);
}

function pick(row, candidates) {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate);
    const match = entries.find(([key]) => normalizeKey(key) === normalizedCandidate);
    if (match && match[1]) return match[1];
  }
  return "";
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function render() {
  renderMemberFilter();
  renderStats();
  renderMemberBreakdown();
  renderBirderTypeBadges();
  renderProfileTrophyCase();
  renderTeamSpeciesTable();
  renderSpeciesTable();
  renderMap();
}

function speciesGroups() {
  const groups = new Map();
  observations.forEach((obs) => {
    const speciesId = getSpeciesId(obs);
    if (!groups.has(speciesId)) {
      groups.set(speciesId, {
        species: obs.species,
        scientific: obs.scientific || "",
        members: new Set(),
        dates: [],
        locations: new Set(),
      });
    }
    const group = groups.get(speciesId);
    group.members.add(normalizeMemberName(obs.member));
    if (obs.date) group.dates.push(obs.date);
    if (obs.location) group.locations.add(obs.location);
  });

  return [...groups.values()].sort((a, b) => a.species.localeCompare(b.species));
}

function renderStats() {
  const groups = speciesGroups();
  const mapped = observations.filter((obs) => obs.latitude !== null && obs.longitude !== null);
  const places = new Set(mapped.map((obs) => `${obs.latitude.toFixed(3)},${obs.longitude.toFixed(3)}`));

  document.querySelector("#speciesCount").textContent = groups.length;
  document.querySelector("#observationCount").textContent = observations.length;
  document.querySelector("#locationCount").textContent = places.size;
  document.querySelector("#sharedCount").textContent = groups.filter((group) => group.members.size === 3).length;
}

function renderMemberFilter() {
  const members = [...new Set(defaultMembers.concat(observations.map((obs) => normalizeMemberName(obs.member))))];
  const current = memberFilter.value;
  memberFilter.innerHTML = '<option value="all">Everyone</option>';
  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member;
    option.textContent = member;
    memberFilter.appendChild(option);
  });
  memberFilter.value = members.includes(current) ? current : "all";
}

function renderMemberBreakdown() {
  const members = [...new Set(defaultMembers.concat(observations.map((obs) => normalizeMemberName(obs.member))))];
  memberBreakdown.innerHTML = "";

  members.forEach((member) => {
    const memberObservations = observations.filter((obs) => normalizeMemberName(obs.member) === member);
    const memberSpecies = new Set(memberObservations.map((obs) => getSpeciesId(obs)));
    const card = document.createElement("article");
    card.className = "member-card";
    card.innerHTML = `
      <strong>${member}</strong>
      <span class="member-card__stats">
        <span>${memberSpecies.size} Life Listers</span>
        <span>${memberObservations.length} Observations</span>
      </span>
    `;
    memberBreakdown.appendChild(card);
  });
}

function renderWhimsyWatch() {
  const dispatches = [
    {
      title: "Saucer Weather Advisory",
      text: "Cloud decks with soft edges are excellent for dramatic bird photos and suspiciously perfect for friendly saucer silhouettes. Official recommendation: scan for raptors first, mysteries second.",
      meta: "Updated this visit | UFO desk",
    },
    {
      title: "Sasquatch Track Protocol",
      text: "If a muddy footprint appears near a warbler hotspot, document scale, substrate, stride, and nearby birds. If it turns out to be a hiking boot, the checklist still counts.",
      meta: "Updated this visit | Forest folklore unit",
    },
    {
      title: "The Cardinal Remains Unbothered",
      text: "Preliminary Rain or Shine analysis suggests cardinals would continue calling from exposed branches even during a low-altitude saucer pass. Confidence: whimsical, but emotionally strong.",
      meta: "Updated this visit | Backyard anomalies",
    },
    {
      title: "Bigfoot's Likely Life Bird",
      text: "Based on habitat preference and a healthy respect for dense cover, today's speculative nominee is Pileated Woodpecker. Large, loud, elusive, and absolutely on brand.",
      meta: "Updated this visit | Cryptid ornithology",
    },
  ];
  const index = new Date().getDate() % dispatches.length;
  const dispatch = dispatches[index];
  whimsyTitle.textContent = dispatch.title;
  whimsyText.textContent = dispatch.text;
  whimsyMeta.textContent = dispatch.meta;
}

function renderBirderTypeBadges() {
  const members = [...new Set(defaultMembers.concat(observations.map((obs) => normalizeMemberName(obs.member))))];
  const profiles = calculateBirderTypeProfiles(members);
  birderTypeBadges.innerHTML = "";

  members.forEach((member) => {
    const profile = profiles.get(member) || calculateFallbackBirderType(member);
    const colorClass = getMemberColorClass(member);
    const card = document.createElement("article");
    card.className = `type-badge type-badge--${colorClass}`;
    card.innerHTML = `
      <div class="type-badge__seal" aria-hidden="true">
        <div class="type-badge__inner type-badge__inner--${colorClass}">
          <span class="type-badge__face"></span>
          <span class="type-badge__name">${escapeHtml(member)}</span>
        </div>
      </div>
      <h3>${escapeHtml(profile.type)}</h3>
      <p>${escapeHtml(profile.reason)}</p>
    `;
    birderTypeBadges.appendChild(card);
  });
}

function calculateBirderTypeProfiles(members) {
  const normalizedMembers = members.map(normalizeMemberName);
  const speciesSeenBy = new Map();
  observations.forEach((obs) => {
    const speciesId = getSpeciesId(obs);
    if (!speciesSeenBy.has(speciesId)) speciesSeenBy.set(speciesId, new Set());
    speciesSeenBy.get(speciesId).add(normalizeMemberName(obs.member));
  });

  const metrics = new Map(
    normalizedMembers.map((member) => {
      const memberObservations = observations.filter((obs) => normalizeMemberName(obs.member) === member);
      const uniqueSpecies = getUniqueLifeListSpecies(member);
      const mapped = memberObservations.filter((obs) => obs.latitude !== null && obs.longitude !== null);
      const places = new Set(mapped.map((obs) => obs.location || `${obs.latitude.toFixed(2)},${obs.longitude.toFixed(2)}`));
      const soloSpecies = uniqueSpecies.filter((obs) => speciesSeenBy.get(getSpeciesId(obs))?.size === 1);
      const dates = memberObservations.map((obs) => obs.date).filter(Boolean).sort();
      const latestObservation = memberObservations
        .filter((obs) => obs.date)
        .sort(compareObservationNewestFirst)[0];
      const latitudes = mapped.map((obs) => obs.latitude);
      const longitudes = mapped.map((obs) => obs.longitude);
      const travelSpan =
        latitudes.length && longitudes.length
          ? Math.abs(Math.max(...latitudes) - Math.min(...latitudes)) + Math.abs(Math.max(...longitudes) - Math.min(...longitudes))
          : 0;
      const signatureBird = latestObservation?.species || uniqueSpecies[0]?.species || "a mystery bird";

      return [
        member,
        {
          member,
          observations: memberObservations.length,
          uniqueSpecies: uniqueSpecies.length,
          places: places.size,
          soloSpecies: soloSpecies.length,
          latestDate: dates[dates.length - 1] || "",
          travelSpan,
          warblers: countSpeciesMatches(memberObservations, /warbler|vireo|kinglet|gnatcatcher/i),
          raptors: countSpeciesMatches(memberObservations, /hawk|eagle|falcon|kite|osprey|owl|vulture|harrier/i),
          waterBirds: countSpeciesMatches(memberObservations, /duck|goose|swan|heron|egret|rail|gull|tern|sandpiper|plover|pelican|cormorant|loon|grebe/i),
          signatureBird,
          soloBird: soloSpecies[0]?.species || signatureBird,
          warblerBird: findSpeciesNameMatch(memberObservations, /warbler|vireo|kinglet|gnatcatcher/i) || signatureBird,
          raptorBird: findSpeciesNameMatch(memberObservations, /hawk|eagle|falcon|kite|osprey|owl|vulture|harrier/i) || signatureBird,
          waterBird: findSpeciesNameMatch(memberObservations, /duck|goose|swan|heron|egret|rail|gull|tern|sandpiper|plover|pelican|cormorant|loon|grebe/i) || signatureBird,
        },
      ];
    })
  );

  const leaders = {
    observations: getMetricLeader(metrics, "observations"),
    uniqueSpecies: getMetricLeader(metrics, "uniqueSpecies"),
    places: getMetricLeader(metrics, "places"),
    soloSpecies: getMetricLeader(metrics, "soloSpecies"),
    travelSpan: getMetricLeader(metrics, "travelSpan"),
    warblers: getMetricLeader(metrics, "warblers"),
    raptors: getMetricLeader(metrics, "raptors"),
    waterBirds: getMetricLeader(metrics, "waterBirds"),
  };

  const profiles = new Map();
  const usedTypes = new Set();
  normalizedMembers.forEach((member) => {
    const data = metrics.get(member);
    if (!data || !data.observations) {
      profiles.set(member, calculateFallbackBirderType(member));
      return;
    }

    const candidates = getBirderTypeCandidates(data, leaders).filter((candidate) => candidate.score > 0);
    const picked = candidates.find((candidate) => !usedTypes.has(candidate.type)) || candidates[0] || calculateFallbackBirderType(member);
    usedTypes.add(picked.type);
    profiles.set(member, picked);
  });

  return profiles;
}

function getBirderTypeCandidates(data, leaders) {
  return [
    {
      type: "Range Roamer",
      score: leaders.travelSpan === data.member ? data.travelSpan + 30 : data.travelSpan,
      reason: `${data.member} has the widest wandering footprint, with ${data.signatureBird} riding along as proof that scattered stops can become ${data.uniqueSpecies} Life Listers across ${data.places} mapped places.`,
    },
    {
      type: "Only-Bird Oracle",
      score: leaders.soloSpecies === data.member ? data.soloSpecies + 25 : data.soloSpecies,
      reason: `${data.member} is carrying ${data.soloSpecies} team-only birds, including ${data.soloBird}; the kind of quiet find that makes the shared list feel deliciously personal.`,
    },
    {
      type: "Checklist Engine",
      score: leaders.observations === data.member ? data.observations + 20 : data.observations / 8,
      reason: `${data.member} brings the steady field-note heartbeat: ${data.observations} observations, with ${data.signatureBird} tucked into the archive like a well-earned field mark.`,
    },
    {
      type: "Life List Cartographer",
      score: leaders.uniqueSpecies === data.member ? data.uniqueSpecies + 18 : data.uniqueSpecies / 3,
      reason: `${data.member} is mapping the team story through breadth: ${data.uniqueSpecies} Life Listers, ${data.places} places, and ${data.signatureBird} as one bright pin on the trail.`,
    },
    {
      type: "Canopy Whisperer",
      score: leaders.warblers === data.member ? data.warblers + 14 : data.warblers,
      reason: `${data.member} has the leafy patience badge: ${data.warblers} warbler-and-friends observations, with ${data.warblerBird} hiding in the branches.`,
    },
    {
      type: "Marsh Magnet",
      score: leaders.waterBirds === data.member ? data.waterBirds + 12 : data.waterBirds,
      reason: `${data.member} keeps finding action along water, mud, reeds, and shorelines, with ${data.waterBird} giving the badge its wetland flavor.`,
    },
    {
      type: "Sky Scanner",
      score: leaders.raptors === data.member ? data.raptors + 10 : data.raptors,
      reason: `${data.member} has upward-glance energy, with ${data.raptorBird} giving the list a little talon and thermals.`,
    },
  ].sort((a, b) => b.score - a.score);
}

function getMetricLeader(metrics, metricName) {
  let leader = "";
  let best = -1;
  metrics.forEach((data, member) => {
    if (data[metricName] > best) {
      best = data[metricName];
      leader = member;
    }
  });
  return best > 0 ? leader : "";
}

function countSpeciesMatches(observationsToCount, pattern) {
  return observationsToCount.filter((obs) => pattern.test(obs.species)).length;
}

function findSpeciesNameMatch(observationsToSearch, pattern) {
  return observationsToSearch.find((obs) => pattern.test(obs.species))?.species || "";
}

function calculateFallbackBirderType(member) {
  const memberObservations = observations.filter((obs) => normalizeMemberName(obs.member) === member);
  const uniqueSpecies = getUniqueLifeListSpecies(member);
  if (!memberObservations.length) {
    return {
      type: "Whimsy Scout",
      reason: "Waiting for a first upload before the badge committee makes its ruling.",
    };
  }

  const mapped = memberObservations.filter((obs) => obs.latitude !== null && obs.longitude !== null);
  const places = new Set(mapped.map((obs) => obs.location || `${obs.latitude.toFixed(2)},${obs.longitude.toFixed(2)}`));
  const recentDates = memberObservations.map((obs) => obs.date).filter(Boolean).sort();
  const latestDate = recentDates[recentDates.length - 1] || "";
  const hasRaptor = memberObservations.some((obs) => /hawk|eagle|falcon|kite|osprey|owl|vulture|harrier/i.test(obs.species));
  const hasWaterBird = memberObservations.some((obs) => /duck|goose|swan|heron|egret|rail|gull|tern|sandpiper|plover|pelican|cormorant|loon|grebe/i.test(obs.species));
  const hasWarbler = memberObservations.some((obs) => /warbler|vireo|kinglet|gnatcatcher/i.test(obs.species));
  const speciesRatio = uniqueSpecies.length / Math.max(memberObservations.length, 1);

  if (hasWarbler && uniqueSpecies.length >= 75) {
    return {
      type: "Warbler Whisperer",
      reason: `${member} is stacking delicate little leaf-movers into a serious life list.`,
    };
  }
  if (hasRaptor) {
    return {
      type: "Sky Scanner",
      reason: `${member} has enough big-sky energy in the list to earn a permanent upward glance.`,
    };
  }
  if (hasWaterBird || places.size >= 8) {
    return {
      type: "Marsh Wanderer",
      reason: `${member} keeps turning shorelines, wetlands, and watery edges into bird evidence.`,
    };
  }
  if (speciesRatio > 0.72 && uniqueSpecies.length >= 25) {
    return {
      type: "Life List Alchemist",
      reason: `${member} turns ordinary outings into fresh species at an impressive clip.`,
    };
  }
  if (latestDate) {
    return {
      type: "Rain or Shine Regular",
      reason: `${member}'s latest logged birding pulse was ${formatDate(latestDate)}, and the streak has a sturdy field-boot feel.`,
    };
  }
  return {
    type: "Field Note Keeper",
    reason: `${member} has the observations rolling in; the badge will sharpen as more dates and places appear.`,
  };
}

function renderProfileTrophyCase() {
  const members = [...new Set(defaultMembers.concat(observations.map((obs) => normalizeMemberName(obs.member))))];
  profileTrophyCase.innerHTML = "";
  userMilestoneBadges = userMilestoneBadges.filter((badge) => badge.badge_kind === "species");

  members.forEach((member) => {
    const userId = getUserId(member);
    const earnedBadges = calculateMilestoneBirdBadges(userId);
    const memberSpecies = getUniqueLifeListSpecies(member);
    const card = document.createElement("article");
    card.className = "profile-card";

    const badgesMarkup = earnedBadges.length
      ? earnedBadges
          .map((badge) => {
            const iconText = badge.milestone_number;
            const scientificName = badge.species_scientific_name
              ? `<p class="badge-card__scientific">${escapeHtml(badge.species_scientific_name)}</p>`
              : "";
            return `
              <article class="badge-card">
                <span class="badge-icon" aria-hidden="true">${escapeHtml(iconText)}</span>
                <div>
                  <strong>${escapeHtml(badge.badge_title)}</strong>
                  ${scientificName}
                  <p>${escapeHtml(badge.badge_description)}</p>
                  <p>${escapeHtml(formatBadgePlace(badge))}</p>
                </div>
              </article>
            `;
          })
          .join("")
      : '<p class="empty-state">Upload a life list to start earning milestone bird badges.</p>';

    card.innerHTML = `
      <div class="profile-card__top">
        <div>
          <h3 class="profile-card__name">${escapeHtml(member)}</h3>
          <p class="profile-card__meta">User ID: ${escapeHtml(userId)}</p>
        </div>
        <span class="profile-card__count">${memberSpecies.length}</span>
      </div>
      <div class="badge-grid">${badgesMarkup}</div>
    `;
    profileTrophyCase.appendChild(card);
  });

  saveMilestoneBadgeStore();
  syncMilestoneBadges();
}

function setupChatAssistant() {
  const endpoint = getChatEndpoint();
  assistantStatus.textContent = endpoint ? "Connected" : "Demo mode";

  addChatMessage(
    "assistant",
    endpoint
      ? "I am connected and ready for bird ID help, trip planning, and general birding chat."
      : "Demo mode is ready. I can format bird ID questions, field-mark checklists, and trip ideas here. To make this a live ChatGPT chat, connect a small secure backend endpoint."
  );

  document.querySelectorAll(".quick-prompts button").forEach((button) => {
    button.addEventListener("click", () => {
      chatInput.value = button.dataset.prompt;
      chatInput.focus();
    });
  });

  birdImageInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      attachedBirdImage = null;
      imagePreview.hidden = true;
      imagePreview.textContent = "";
      return;
    }

    attachedBirdImage = {
      name: file.name,
      type: file.type,
      dataUrl: await readFileAsDataUrl(file),
    };
    imagePreview.hidden = false;
    imagePreview.textContent = `Attached: ${file.name}`;
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message && !attachedBirdImage) return;

    const userMessage = attachedBirdImage ? `${message || "Please help ID this bird."} [Photo attached: ${attachedBirdImage.name}]` : message;
    addChatMessage("user", userMessage);
    chatInput.value = "";

    const imageForRequest = attachedBirdImage;
    attachedBirdImage = null;
    birdImageInput.value = "";
    imagePreview.hidden = true;
    imagePreview.textContent = "";

    const reply = await getAssistantReply(message, imageForRequest);
    addChatMessage("assistant", reply);
  });
}

function setupAuth() {
  applyAuthHash();
  updateAuthStatus();

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = authEmail.value.trim();
    if (!email) return;
    if (!hasSupabaseConfig()) {
      authStatus.textContent = "Supabase is not configured yet. Add the Netlify environment variables, then redeploy.";
      return;
    }

    try {
      await supabaseAuthRequest("/otp", {
        email,
        create_user: false,
        options: {
          emailRedirectTo: location.origin + location.pathname,
        },
      });
      authStatus.textContent = "Magic link sent. Open it on this device to sync the team data.";
    } catch (error) {
      authStatus.textContent = `Sign-in failed: ${error.message}`;
    }
  });

  signOutButton.addEventListener("click", () => {
    authSession = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    isRemoteReady = false;
    updateAuthStatus();
    updateSyncStatus();
  });
}

async function initRemoteData() {
  await loadRemoteConfig();
  applyAuthHash();
  updateAuthStatus();
  updateSyncStatus();

  if (!isRemoteReady) return;

  try {
    observations = (await remoteSelect("observations")).map(fromRemoteObservation);
    userMilestoneBadges = (await remoteSelect("user_milestone_badges")).map(fromRemoteBadge);
    saveObservations();
    saveMilestoneBadgeStore();
    render();
    syncStatus.textContent = `Synced shared team data from Supabase. ${observations.length} observations loaded.`;
  } catch (error) {
    syncStatus.textContent = `Could not load shared data, so local preview data is still showing. ${error.message}`;
  }
}

async function loadRemoteConfig() {
  const endpoint = window.RSB_CONFIG_ENDPOINT || "";
  if (!endpoint) {
    updateSyncStatus();
    return;
  }

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Config function did not respond.");
    const config = await response.json();
    appConfig = {
      supabaseUrl: config.supabaseUrl || "",
      supabaseAnonKey: config.supabaseAnonKey || "",
    };
  } catch (error) {
    syncStatus.textContent = `Config not loaded yet. ${error.message}`;
  }

  isRemoteReady = hasSupabaseConfig() && Boolean(authSession?.access_token);
}

function applyAuthHash() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in") || 3600);

  if (accessToken) {
    authSession = {
      access_token: accessToken,
      refresh_token: refreshToken || "",
      expires_at: Date.now() + expiresIn * 1000,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authSession));
    history.replaceState(null, "", location.pathname);
  }
}

function updateAuthStatus() {
  const configured = hasSupabaseConfig();
  signOutButton.hidden = !authSession;
  const memberName = getSignedInMemberName();
  welcomeMessage.textContent = memberName ? `Welcome, ${memberName}.` : "Welcome, whimsical birder.";

  if (!configured) {
    authStatus.textContent = "Connect Supabase to enable shared team data.";
  } else if (authSession) {
    authStatus.textContent = "Signed in. Uploads and milestone badges will sync to the team database.";
  } else {
    authStatus.textContent = "Supabase is connected. Sign in with a team email to sync shared data.";
  }
}

function updateSyncStatus() {
  if (!hasSupabaseConfig()) {
    syncStatus.textContent = "Local preview mode";
  } else if (!authSession) {
    syncStatus.textContent = "Shared database connected. Sign in to sync.";
  } else {
    syncStatus.textContent = "Shared database connected.";
  }
}

function getSignedInMemberName() {
  const email = getSignedInEmail();
  if (!email) return "";
  return emailMemberMap[email.toLowerCase()] || email.split("@")[0];
}

function getSignedInEmail() {
  const payload = decodeJwtPayload(authSession?.access_token);
  return payload?.email || payload?.user_metadata?.email || "";
}

function decodeJwtPayload(token) {
  if (!token || !token.includes(".")) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

async function getAssistantReply(message, image) {
  const endpoint = getChatEndpoint();
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          image,
          context: {
            team: "Rain or Shine Birding Team",
            members: defaultMembers,
            speciesCount: speciesGroups().length,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Assistant request failed: ${response.status}`);
      }
      return data.reply || data.output_text || "I received the request, but no reply text came back.";
    } catch (error) {
      return `The live assistant endpoint returned this error: ${error.message}. Demo fallback: ${getDemoAssistantReply(message, image)}`;
    }
  }

  return getDemoAssistantReply(message, image);
}

function getDemoAssistantReply(message, image) {
  if (image) {
    return "For a real bird photo ID, I would send the image to a secure ChatGPT vision endpoint. Add location, date, size, behavior, habitat, colors, wing bars, bill shape, and any call notes, then I can help narrow candidates and explain what field marks matter.";
  }

  const text = message.toLowerCase();
  if (text.includes("compare") || text.includes("similar")) {
    return "Good comparison prompt: ask for size, structure, bill shape, eye ring, wing bars, tail pattern, behavior, habitat, season, and range. For tricky pairs, I would also ask what Merlin suggested and what felt off in the field.";
  }
  if (text.includes("trip") || text.includes("walk") || text.includes("weekend")) {
    return "Rain-or-shine plan: pick one wetland edge, one woodland trail, and one open field stop. Start near sunrise, log every checklist separately, and choose one target bird for each person so the outing has a little friendly quest energy.";
  }
  if (text.includes("id") || text.includes("identify") || text.includes("field mark")) {
    return "For bird ID, send a photo when you have one and include location, date, habitat, size, colors, behavior, call, and whether it was alone or in a flock. I will give likely candidates, confidence, and what to check next.";
  }
  return "I can help with bird ID, field marks, eBird checklist wording, trip ideas, target species, and friendly Rain or Shine banter. The live ChatGPT connection just needs a small backend endpoint so your API key stays private.";
}

function addChatMessage(role, text) {
  const message = document.createElement("article");
  message.className = `chat-message chat-message--${role}`;
  message.innerHTML = `<strong>${role === "assistant" ? "Assistant" : "You"}</strong><p>${escapeHtml(text)}</p>`;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getChatEndpoint() {
  return window.RSB_CHAT_ENDPOINT || "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function calculateMilestoneBirdBadges(userId) {
  const member = getMemberByUserId(userId);
  if (!member) return [];

  const lifeList = getUniqueLifeListSpecies(member);
  const milestones = getMilestoneNumbers(lifeList.length);
  const earned = [];

  milestones.forEach((milestone) => {
    const milestoneSpecies = lifeList[milestone - 1];
    if (!milestoneSpecies) return;

    const speciesBadge = buildSpeciesMilestoneBadge(userId, member, milestone, milestoneSpecies);

    earned.push(upsertMilestoneBadge(speciesBadge));
  });

  return earned.sort((a, b) => {
    return a.milestone_number - b.milestone_number;
  });
}

function getUniqueLifeListSpecies(member) {
  const firstBySpecies = new Map();
  observations
    .filter((obs) => normalizeMemberName(obs.member) === normalizeMemberName(member))
    .forEach((obs) => {
      const speciesId = getSpeciesId(obs);
      const current = firstBySpecies.get(speciesId);
      if (!current || compareLifeListEntries(obs, current) < 0) {
        firstBySpecies.set(speciesId, obs);
      }
    });

  return [...firstBySpecies.values()].sort(compareLifeListEntries);
}

function compareLifeListEntries(a, b) {
  const dateA = a.date || "9999-12-31";
  const dateB = b.date || "9999-12-31";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  const speciesCompare = a.species.localeCompare(b.species);
  if (speciesCompare !== 0) return speciesCompare;
  return (a.location || "").localeCompare(b.location || "");
}

function getMilestoneNumbers(totalSpecies) {
  const milestones = [];
  if (totalSpecies >= 1) milestones.push(1);
  for (let milestone = 50; milestone <= totalSpecies; milestone += 50) {
    milestones.push(milestone);
  }
  return milestones;
}

function buildSpeciesMilestoneBadge(userId, member, milestone, species) {
  return {
    id: `${userId}-species-${milestone}`,
    badge_kind: "species",
    user_id: userId,
    member_name: member,
    milestone_number: milestone,
    species_id: getSpeciesId(species),
    species_common_name: species.species,
    species_scientific_name: species.scientific || "",
    date_seen: species.date || "",
    location_name: species.location || "",
    badge_title: `${species.species} - ${ordinal(milestone)} Bird`,
    badge_description: buildSpeciesBadgeDescription(member, milestone, species),
    badge_image_url: "placeholder://species-milestone-badge",
  };
}

function buildSpeciesBadgeDescription(member, milestone, species) {
  const dateText = species.date ? ` on ${formatDate(species.date)}` : "";
  const locationText = species.location ? ` at ${species.location}` : "";
  return `Big day for ${member}: ${species.species} was the ${ordinal(milestone)} bird on the life list${dateText}${locationText}. Rain or shine, that one gets a spot in the trophy case.`;
}

function formatBadgePlace(badge) {
  if (badge.date_seen && badge.location_name) return `${formatDate(badge.date_seen)} | ${badge.location_name}`;
  if (badge.date_seen) return formatDate(badge.date_seen);
  if (badge.location_name) return badge.location_name;
  return "Location not listed";
}

function upsertMilestoneBadge(nextBadge) {
  const now = new Date().toISOString();
  const existingIndex = userMilestoneBadges.findIndex((badge) => badge.id === nextBadge.id);

  if (existingIndex >= 0) {
    const existing = userMilestoneBadges[existingIndex];
    userMilestoneBadges[existingIndex] = {
      ...existing,
      ...nextBadge,
      awarded_at: existing.awarded_at || now,
      created_at: existing.created_at || now,
    };
    return userMilestoneBadges[existingIndex];
  }

  const created = {
    ...nextBadge,
    awarded_at: now,
    created_at: now,
  };
  userMilestoneBadges.push(created);
  return created;
}

function getSpeciesId(obs) {
  return normalizeKey(obs.scientific || obs.species);
}

function getUserId(member) {
  return normalizeKey(member);
}

function getMemberByUserId(userId) {
  return defaultMembers.concat(observations.map((obs) => normalizeMemberName(obs.member))).find((member) => getUserId(member) === userId);
}

function ordinal(value) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function renderTeamSpeciesTable() {
  const groups = speciesGroups();
  teamSpeciesTable.innerHTML = "";
  teamSpeciesEmpty.style.display = groups.length ? "none" : "block";

  groups.forEach((group) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(group.species)}</strong></td>
      ${teamSpeciesMembers
        .map((member) => {
          const seen = group.members.has(member);
          const className = getMemberColorClass(member);
          return `<td>${seen ? `<span class="seen-dot seen-dot--${className}" title="${escapeHtml(member)} has seen this bird"></span>` : ""}</td>`;
        })
        .join("")}
    `;
    teamSpeciesTable.appendChild(row);
  });
}

function renderSpeciesTable() {
  const query = speciesSearch.value.trim().toLowerCase();
  const entries = aggregateObservationLedger()
    .filter((obs) => {
      const haystack = `${obs.species} ${obs.member} ${obs.location || ""} ${obs.date || ""}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort(compareObservationNewestFirst);

  speciesTable.innerHTML = "";
  tableEmpty.style.display = entries.length ? "none" : "block";

  entries.forEach((obs) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(obs.species)}</strong>${obs.scientific ? `<br><span class="scientific">${escapeHtml(obs.scientific)}</span>` : ""}</td>
      <td><div class="pill-list"><span class="pill">${escapeHtml(obs.member)}</span></div></td>
      <td>${escapeHtml(obs.date ? formatDate(obs.date) : "Unknown")}</td>
      <td>${escapeHtml(obs.location || "Unknown")}</td>
      <td>${escapeHtml(obs.totalCount)}</td>
    `;
    speciesTable.appendChild(row);
  });
}

function aggregateObservationLedger() {
  const grouped = new Map();

  observations.forEach((obs) => {
    const member = normalizeMemberName(obs.member);
    const key = [member, getSpeciesId(obs), obs.date || "", normalizeKey(obs.location || "")].join("||");
    const existing = grouped.get(key);
    const countInfo = parseObservationCount(obs.count);

    if (!existing) {
      grouped.set(key, {
        ...obs,
        member,
        numericTotal: countInfo.numeric,
        hasUnknownCount: countInfo.unknown,
      });
      return;
    }

    existing.numericTotal += countInfo.numeric;
    existing.hasUnknownCount = existing.hasUnknownCount || countInfo.unknown;
  });

  return [...grouped.values()].map((entry) => ({
    ...entry,
    totalCount: formatObservationTotal(entry.numericTotal, entry.hasUnknownCount),
  }));
}

function parseObservationCount(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return { numeric: 1, unknown: false };
  if (cleaned.toUpperCase() === "X") return { numeric: 0, unknown: true };
  const parsed = Number.parseInt(cleaned.replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? { numeric: parsed, unknown: false } : { numeric: 0, unknown: true };
}

function formatObservationTotal(total, hasUnknownCount) {
  if (total && hasUnknownCount) return `${total}+`;
  if (total) return String(total);
  return hasUnknownCount ? "X" : "1";
}

function compareObservationNewestFirst(a, b) {
  const dateA = a.date || "0000-00-00";
  const dateB = b.date || "0000-00-00";
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  const speciesCompare = a.species.localeCompare(b.species);
  if (speciesCompare !== 0) return speciesCompare;
  return a.member.localeCompare(b.member);
}

async function saveImport(member, sourceName, imported) {
  saveObservations();

  if (!isRemoteReady) {
    syncStatus.textContent = `Saved ${imported.length} rows locally. Sign in after Supabase is connected to sync shared data.`;
    return;
  }

  try {
    await remoteDelete("observations", `member_name=eq.${encodeURIComponent(member)}`);
    const importRows = await remoteInsert("imports", [
      {
        member_name: member,
        source_name: sourceName,
        row_count: imported.length,
      },
    ]);
    const importId = importRows[0]?.id || null;
    const remoteRows = imported.map((obs) => toRemoteObservation(obs, importId));

    if (remoteRows.length) {
      await remoteUpsert("observations", remoteRows, "id");
    }

    syncStatus.textContent = `Synced ${imported.length} ${member} observations to Supabase.`;
  } catch (error) {
    syncStatus.textContent = `Saved locally, but Supabase sync failed: ${error.message}`;
  }
}

async function syncMilestoneBadges() {
  const speciesBadges = userMilestoneBadges.filter((badge) => badge.badge_kind === "species");
  if (!isRemoteReady || !speciesBadges.length) return;
  try {
    await remoteUpsert("user_milestone_badges", speciesBadges.map(toRemoteBadge), "id");
  } catch (error) {
    syncStatus.textContent = `Badge sync failed: ${error.message}`;
  }
}

async function supabaseAuthRequest(path, body) {
  const response = await fetch(`${appConfig.supabaseUrl}/auth/v1${path}`, {
    method: "POST",
    headers: supabaseHeaders(false),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || data.error_description || data.error || response.statusText);
  }
  return response.json().catch(() => ({}));
}

async function remoteSelect(table) {
  const response = await fetch(`${appConfig.supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: supabaseHeaders(true),
  });
  return parseSupabaseResponse(response);
}

async function remoteInsert(table, rows) {
  const response = await fetch(`${appConfig.supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...supabaseHeaders(true), Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  return parseSupabaseResponse(response);
}

async function remoteUpsert(table, rows, conflictColumn) {
  const response = await fetch(`${appConfig.supabaseUrl}/rest/v1/${table}?on_conflict=${conflictColumn}`, {
    method: "POST",
    headers: { ...supabaseHeaders(true), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
  return parseSupabaseResponse(response);
}

async function remoteDelete(table, filter = "") {
  const url = `${appConfig.supabaseUrl}/rest/v1/${table}${filter ? `?${filter}` : ""}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: supabaseHeaders(true),
  });
  if (!response.ok) await parseSupabaseResponse(response);
}

async function parseSupabaseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) {
    throw new Error(data.message || data.msg || data.error || response.statusText);
  }
  return data;
}

function supabaseHeaders(includeAuth) {
  const headers = {
    apikey: appConfig.supabaseAnonKey,
    "Content-Type": "application/json",
  };
  if (includeAuth && authSession?.access_token) {
    headers.Authorization = `Bearer ${authSession.access_token}`;
  }
  return headers;
}

function hasSupabaseConfig() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

function toRemoteObservation(obs, importId) {
  return {
    id: obs.id,
    member_name: normalizeMemberName(obs.member),
    species_common_name: obs.species,
    species_scientific_name: obs.scientific || null,
    date_seen: obs.date || null,
    count_seen: obs.count || null,
    latitude: obs.latitude,
    longitude: obs.longitude,
    location_name: obs.location || null,
    checklist_id: obs.checklist || null,
    source_name: obs.sourceName || null,
    import_id: importId,
  };
}

function fromRemoteObservation(row) {
  return {
    id: row.id,
    member: normalizeMemberName(row.member_name),
    species: row.species_common_name,
    scientific: row.species_scientific_name || "",
    date: row.date_seen || "",
    count: row.count_seen || "",
    latitude: parseNumber(row.latitude),
    longitude: parseNumber(row.longitude),
    location: row.location_name || "Unlisted place",
    checklist: row.checklist_id || "",
    sourceName: row.source_name || "",
  };
}

function toRemoteBadge(badge) {
  return {
    id: badge.id,
    badge_kind: badge.badge_kind,
    user_id: badge.user_id,
    member_name: badge.member_name || getMemberByUserId(badge.user_id) || badge.user_id,
    milestone_number: badge.milestone_number,
    species_id: badge.species_id || null,
    species_common_name: badge.species_common_name || null,
    species_scientific_name: badge.species_scientific_name || null,
    date_seen: badge.date_seen || null,
    location_name: badge.location_name || null,
    badge_title: badge.badge_title,
    badge_description: badge.badge_description,
    badge_image_url: badge.badge_image_url || null,
    awarded_at: badge.awarded_at,
    created_at: badge.created_at,
  };
}

function fromRemoteBadge(row) {
  return {
    id: row.id,
    badge_kind: row.badge_kind,
    user_id: row.user_id,
    member_name: row.member_name,
    milestone_number: row.milestone_number,
    species_id: row.species_id || "",
    species_common_name: row.species_common_name || "",
    species_scientific_name: row.species_scientific_name || "",
    date_seen: row.date_seen || "",
    location_name: row.location_name || "",
    badge_title: row.badge_title,
    badge_description: row.badge_description,
    badge_image_url: row.badge_image_url || "",
    awarded_at: row.awarded_at,
    created_at: row.created_at,
  };
}

function renderMap() {
  const selected = memberFilter.value;
  const points = observations
    .filter((obs) => selected === "all" || normalizeMemberName(obs.member) === selected)
    .filter((obs) => obs.latitude !== null && obs.longitude !== null);

  mapEmpty.style.display = points.length ? "none" : "grid";
  if (!window.L) {
    mapEmpty.style.display = "grid";
    mapEmpty.textContent = "Map tiles are loading. Refresh if the map does not appear.";
    return;
  }

  if (!birdMap) {
    birdMap = L.map(mapContainer, {
      scrollWheelZoom: false,
    }).setView([39.5, -98.35], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(birdMap);
  }

  if (birdMapLayer) birdMapLayer.remove();
  birdMapLayer = L.layerGroup().addTo(birdMap);
  if (!points.length) return;

  const bounds = [];
  points.forEach((point) => {
    const member = normalizeMemberName(point.member);
    const markerColor = getMemberColor(member);
    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 7,
      color: "#fffdf5",
      weight: 2,
      fillColor: markerColor,
      fillOpacity: 0.88,
    }).addTo(birdMapLayer);
    marker.bindPopup(`
      <strong>${escapeHtml(member)}</strong><br>
      ${escapeHtml(point.date ? formatDate(point.date) : "Unknown date")}<br>
      ${escapeHtml(point.location || "Unknown place")}
    `);
    bounds.push([point.latitude, point.longitude]);
  });

  birdMap.fitBounds(bounds, { padding: [26, 26], maxZoom: 12 });
  setTimeout(() => birdMap.invalidateSize(), 0);
}

function saveObservations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

function saveMilestoneBadgeStore() {
  localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(userMilestoneBadges));
}

function loadObservations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadMilestoneBadgeStore() {
  try {
    return JSON.parse(localStorage.getItem(BADGE_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadAuthSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY));
    if (!session?.access_token) return null;
    if (session.expires_at && session.expires_at < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
