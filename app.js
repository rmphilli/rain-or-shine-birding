const STORAGE_KEY = "rainOrShineBirdingData";
const BADGE_STORAGE_KEY = "rainOrShineMilestoneBadges";
const SESSION_STORAGE_KEY = "rainOrShineSupabaseSession";
const REMOTE_PAGE_SIZE = 1000;
const AUTO_SYNC_INTERVAL_MS = 60 * 1000;
const AUTO_SYNC_MIN_GAP_MS = 15 * 1000;
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
const MORTON_HOME = { latitude: 40.6128, longitude: -89.4593 };
const lifeListExcludedTaxa = new Set(["anserspdomestictype", "trochilidaesp"]);
const lifeListTaxonAliases = {
  ardeaherodiasherodiasgroup: "ardeaherodias",
  anasplatyrhynchosdomestictype: "anasplatyrhynchos",
  columbaliviaferalpigeon: "columbalivia",
};
const memberLifeListDisplayOverrides = {
  // The raw export remains untouched. Apply only while Matt's canonical total is the known 233-to-232 mismatch.
  Matt: { canonicalCount: 233, displayCount: 232 },
};
const adventureFinds = {
  birding: [
    {
      title: "Fall WPBO Birding Tours",
      region: "Whitefish Point, Michigan",
      dateLabel: "Sep 12-13 or Oct 3-4, 2026",
      note: "Small-group fall migration weekends with Michigan Audubon at Whitefish Point.",
      url: "https://www.michiganaudubon.org/upcoming-trips-workshops/",
    },
    {
      title: "Shorebirding Weekend Adventure",
      region: "Illinois River Valley",
      dateLabel: "Aug 22-23, 2026",
      note: "A guided weekend focused on shorebirds, waterfowl, and whatever else turns up.",
      url: "https://illinoisaudubon.org/blog/field-trip/shorebirding-weekend-adventure-8-22-23-26/",
    },
    {
      title: "Fall Migration: Chicago Lakefront Focus",
      region: "Chicago, Illinois",
      dateLabel: "Sep 9, 2026",
      note: "A compact guided morning at Jarvis Bird Sanctuary with fall warblers squarely in view.",
      url: "https://illinoisaudubon.org/blog/field-trip/fall-migration-chicago-lakefront-focus-9-9-26/",
    },
    {
      title: "Michigan: Hotspots & Warblers",
      region: "Michigan",
      dateLabel: "May 12-20, 2027",
      note: "A small-group migration circuit with Tawas, Kirtland's Warbler country, and Whitefish Point.",
      url: "https://fieldguides.com/bird-tours/michigan/",
    },
    {
      title: "Shorebirding Mid-Week Adventure",
      region: "Central Illinois River Valley",
      dateLabel: "Aug 20-21, 2026",
      note: "Two guided weekdays among Illinois River shorebirds, waterfowl, and migration surprises.",
      url: "https://illinoisaudubon.org/blog/field-trip/shorebirding-mid-week-adventure-8-20-21-26/",
    },
    {
      title: "Fall Migration: Chicago Lakefront Focus",
      region: "Chicago, Illinois",
      dateLabel: "Sep 16, 2026",
      note: "A second small-group lakefront morning timed for fall migrants at Jarvis Bird Sanctuary.",
      url: "https://illinoisaudubon.org/blog/field-trip/fall-migration-chicago-lakefront-focus-9-16-2026-2/",
    },
    {
      title: "Dixon Waterfowl Refuge Fall Birding",
      region: "Hennepin, Illinois",
      dateLabel: "Oct 24, 2026",
      note: "A guided fall outing with Doug Stotz across wetland, prairie, and woodland habitat.",
      url: "https://illinoisaudubon.org/blog/field-trip/dixon-waterfowl-refuge-fall-birding-adventure-with-doug-stotz-10-24-26/",
    },
  ],
  bigfoot: [
    {
      title: "Ohio BFRO Expedition",
      region: "Ohio field location",
      dateLabel: "Sep 17-20 or Oct 15-18, 2026",
      note: "A multi-night BFRO field expedition with basecamp and nighttime teams in active Ohio areas.",
      url: "https://www.bfro.net/news/roundup/ohio.asp",
    },
    {
      title: "Wisconsin BFRO Expedition",
      region: "Wisconsin Driftless Area",
      dateLabel: "Oct 1-4, 2026",
      note: "A guided nighttime field expedition in one of Wisconsin's most active report areas.",
      url: "https://www.bfro.net/news/roundup/wisconsin.asp",
    },
    {
      title: "Indiana Bigfoot Conference",
      region: "Nashville, Indiana",
      dateLabel: "Sep 25-26, 2026",
      note: "Firsthand encounters, researchers, and local makers at The Seasons Lodge.",
      url: "https://www.indianabigfootconference.com/",
    },
    {
      title: "Goatman Festival",
      region: "Louisville, Kentucky",
      dateLabel: "Oct 15-18, 2026",
      note: "A free cryptid gathering with Bigfoot researchers, special tours, films, music, and a creature market.",
      url: "https://goatmanfest.com/",
    },
    {
      title: "Illinois BFRO Expedition",
      region: "Illinois field location",
      dateLabel: "Sep 10-13, 2026",
      note: "A multi-night BFRO expedition with field teams, nighttime observation, and a nearby Illinois basecamp.",
      url: "https://bfro.net/news/roundup/expeds_2026.asp",
    },
    {
      title: "Missouri BFRO Expedition",
      region: "Missouri field location",
      dateLabel: "Oct 22-25, 2026",
      note: "A guided fall expedition in an active Missouri report area with organized nighttime teams.",
      url: "https://bfro.net/news/roundup/expeds_2026.asp",
    },
    {
      title: "New York Bigfoot Conference",
      region: "New York",
      dateLabel: "Oct 3, 2026",
      note: "A one-day gathering of investigators, witnesses, speakers, and curious cryptid-minded travelers.",
      url: "https://nybigfootconference.com/event-tickets/",
    },
  ],
  paranormal: [
    {
      title: "Psi Games International",
      region: "Schedule announcement pending",
      dateLabel: "2026",
      note: "Friendly competitions in remote viewing, intuition, psychokinesis, and other psi skills.",
      url: "https://psigamesinternational.com/",
    },
    {
      title: "Lake Superior Paranormal Convention",
      region: "Thunder Bay, Ontario",
      dateLabel: "Oct 16-17, 2026",
      note: "Speakers, workshops, and an optional after-dark investigation at Fort William.",
      url: "https://www.lakesuperiorparacon.com/tickets",
    },
    {
      title: "Halifax Paranormal Symposium",
      region: "Halifax, Nova Scotia",
      dateLabel: "Oct 2026",
      note: "Two days of paranormal research, workshops, vendors, psychics, and curious minds.",
      url: "https://www.hfxparanormal.com/",
    },
    {
      title: "Extraterrestrials: Conscious Universe",
      region: "Prague or live stream",
      dateLabel: "Nov 13-15, 2026",
      note: "An international conference on UFOs, contact, consciousness, history, and spirituality.",
      url: "https://www.ufokonference.cz/en/",
    },
    {
      title: "Great Lakes Paranormal Convention",
      region: "New Baltimore, Michigan",
      dateLabel: "Aug 15-16, 2026",
      note: "Investigators, authors, vendors, and hands-on paranormal sessions near the Great Lakes.",
      url: "https://www.michigan.org/event/great-lakes-paranormal-convention-0",
    },
    {
      title: "MUFON International Symposium",
      region: "Covington, Kentucky",
      dateLabel: "Aug 27-30, 2026",
      note: "A major UFO research gathering with investigators, case studies, speakers, and skyward questions.",
      url: "https://mufonsymposium.com/",
    },
    {
      title: "Ghostly Great Lakes Weekend",
      region: "Sault Ste. Marie, Michigan",
      dateLabel: "Aug 28-29, 2026",
      note: "Michigan Paracon speakers and investigations gathered beside the locks and old waterfront.",
      url: "https://saultstemarie.com/event/ghostly-great-lakes-weekend/",
    },
    {
      title: "IFEX SETI & UAP Conference",
      region: "Wurzburg, Germany",
      dateLabel: "Sep 23-24, 2026",
      note: "A university-hosted scientific conference focused on SETI, UAP research, methods, and evidence.",
      url: "https://www.uni-wuerzburg.de/ifex/veranstaltungen/ifex-seti-uap-konferenz-2026/",
    },
  ],
};

let observations = loadObservations();
let userMilestoneBadges = loadMilestoneBadgeStore();
let appConfig = { supabaseUrl: "", supabaseAnonKey: "" };
let authSession = loadAuthSession();
let isRemoteReady = false;
let sessionRefreshPromise = null;
let remoteSyncPromise = null;
let lastRemoteSyncAt = 0;
let authNotice = "";
let signedInMemberName = "";
let nearbyTargetSightings = [];

const fileInputs = document.querySelectorAll(".file-input");
const speciesTable = document.querySelector("#speciesTable");
const tableEmpty = document.querySelector("#tableEmpty");
const teamSpeciesTable = document.querySelector("#teamSpeciesTable");
const teamSpeciesEmpty = document.querySelector("#teamSpeciesEmpty");
const teamTargetsTable = document.querySelector("#teamTargetsTable");
const teamTargetsEmpty = document.querySelector("#teamTargetsEmpty");
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
const refreshSharedDataButton = document.querySelector("#refreshSharedData");
const publishLocalDataButton = document.querySelector("#publishLocalData");
const resetDataButton = document.querySelector("#resetData");
const ambienceToggle = document.querySelector("#ambienceToggle");
const ambienceToggleLabel = document.querySelector("#ambienceToggleLabel");
const welcomeMessage = document.querySelector("#welcomeMessage");
const teamTravelMiles = document.querySelector("#teamTravelMiles");
const teamTravelVisits = document.querySelector("#teamTravelVisits");
const teamTravelTrips = document.querySelector("#teamTravelTrips");
const teamTravelMeta = document.querySelector("#teamTravelMeta");
const nearbyTargetsList = document.querySelector("#nearbyTargetsList");
const nearbyTargetsStatus = document.querySelector("#nearbyTargetsStatus");
const nearbyTargetsMeta = document.querySelector("#nearbyTargetsMeta");
const nearbyTargetsRefreshButton = document.querySelector("#nearbyTargetsRefreshButton");
const adventureLists = {
  birding: document.querySelector("#birdingAdventureList"),
  bigfoot: document.querySelector("#bigfootAdventureList"),
  paranormal: document.querySelector("#paranormalAdventureList"),
};
const adventureStatus = document.querySelector("#adventureStatus");
const adventureMeta = document.querySelector("#adventureMeta");
const adventureRefreshButton = document.querySelector("#adventureRefreshButton");

let attachedBirdImage = null;
let birdMap = null;
let birdMapLayer = null;
let birdMapBounds = [];
let birdMapSelectedMarker = null;
let ambientAudioContext = null;
let ambientMasterGain = null;
let ambientRainSources = [];
let ambientRainDropTimer = null;
let ambientRainSwellTimer = null;
let ambientBirdTimer = null;

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

    const hint = event.target.closest(".upload-card").querySelector(".upload-card__hint");
    const member = normalizeMemberName(event.target.dataset.member);
    hint.textContent = "Reading CSV...";

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const imported = normalizeRows(rows, member, file.name);
      if (!imported.length) {
        throw new Error("No bird rows were found. Use an eBird CSV with a Common Name or Species column.");
      }

      observations = observations.filter((item) => normalizeMemberName(item.member) !== member).concat(imported);
      hint.textContent = isRemoteReady ? "Syncing..." : "Saving...";
      const synced = await saveImport(member, file.name, imported);
      hint.textContent = synced ? `${imported.length} rows shared` : `${imported.length} rows saved here`;
      render();
    } catch (error) {
      hint.textContent = "Try another CSV";
      syncStatus.textContent = `Import failed: ${error.message}`;
    }
  });
});

resetDataButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Clear the bird data saved in this browser? The shared team database will not be changed."
  );
  if (!confirmed) return;

  observations = [];
  userMilestoneBadges = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BADGE_STORAGE_KEY);
  fileInputs.forEach((input) => {
    input.value = "";
    input.closest(".upload-card").querySelector(".upload-card__hint").textContent = "Choose CSV";
  });
  syncStatus.textContent = isRemoteReady
    ? "This browser's saved copy was cleared. Refresh shared data to load the team cloud again."
    : "This browser's saved copy was cleared.";
  render();
});

memberFilter.addEventListener("change", renderMap);
speciesSearch.addEventListener("input", renderSpeciesTable);
refreshSharedDataButton.addEventListener("click", () => syncRemoteData({ force: true }));
publishLocalDataButton.addEventListener("click", publishLocalDataToCloud);
nearbyTargetsRefreshButton.addEventListener("click", () => loadNearbyTargetSightings({ announce: true }));
adventureRefreshButton.addEventListener("click", () => loadAdventureFinds({ announce: true }));
window.addEventListener("resize", scheduleMapRefresh);
window.addEventListener("orientationchange", scheduleMapRefresh);
setupChatAssistant();
setupAmbientSound();
setupBazaarEntryPoints();
setupAuth();
setupAutoSync();
initRemoteData();
renderAdventureFinds();
loadAdventureFinds();
loadNearbyTargetSightings();

render();

function setupBazaarEntryPoints() {
  document.querySelectorAll("[data-bazaar-entry]").forEach((entry) => {
    entry.hidden = !window.RSB_BAZAAR_ENABLED;
  });
  if (window.RSB_BAZAAR_ENABLED) renderDashboardBazaar();
}

function renderDashboardBazaar() {
  const grid = document.querySelector("#dashboardBazaarGrid");
  if (!grid) return;
  const finds = Array.isArray(window["RSB_BAZAAR_FINDS"]) ? window["RSB_BAZAAR_FINDS"] : [];
  const verified = document.querySelector("#dashboardBazaarVerified");
  if (verified && window["RSB_BAZAAR_VERIFIED_AT"]) {
    verified.textContent = `Verified ${window["RSB_BAZAAR_VERIFIED_AT"]}`;
  }

  const preferences = loadDashboardBazaarPreferences();
  grid.replaceChildren(
    ...finds.map((find) => createDashboardBazaarCard(find, preferences, renderDashboardBazaar)),
  );
}

function createDashboardBazaarCard(find, preferences, rerender) {
  const card = document.createElement("article");
  card.className = "bazaar-card";

  const art = document.createElement("div");
  art.className = "bazaar-card__art";
  art.setAttribute("aria-hidden", "true");
  const monogram = document.createElement("span");
  monogram.className = "bazaar-card__monogram";
  monogram.textContent = find.monogram;
  art.appendChild(monogram);

  const body = document.createElement("div");
  body.className = "bazaar-card__body";
  const meta = document.createElement("div");
  meta.className = "bazaar-card__meta";
  const category = document.createElement("span");
  category.textContent = find.categoryLabel;
  const vendor = document.createElement("span");
  vendor.textContent = find.vendor;
  meta.append(category, vendor);

  const title = document.createElement("h3");
  const dealLink = document.createElement("a");
  dealLink.href = find.url;
  dealLink.target = "_blank";
  dealLink.rel = "noopener noreferrer";
  dealLink.textContent = find.name;
  title.appendChild(dealLink);

  const description = document.createElement("p");
  description.className = "bazaar-card__description";
  description.textContent = find.description;

  const price = document.createElement("p");
  price.className = "bazaar-card__price";
  const amount = document.createElement("strong");
  amount.textContent = formatBazaarPrice(find.price);
  const regular = document.createElement("del");
  regular.textContent = formatBazaarPrice(find.regularPrice);
  const saving = document.createElement("span");
  saving.textContent = `${find.discount}% off`;
  price.append(amount, regular, saving);

  const retailerLink = document.createElement("a");
  retailerLink.className = "bazaar-card__retailer-link";
  retailerLink.href = find.url;
  retailerLink.target = "_blank";
  retailerLink.rel = "noopener noreferrer";
  retailerLink.textContent = `View at ${find.vendor}`;
  body.append(meta, title, description, price, retailerLink);

  const actions = document.createElement("div");
  actions.className = "bazaar-card__actions";
  actions.setAttribute("aria-label", `Preference for ${find.name}`);
  ["Watch", "Want", "Maybe", "Pass"].forEach((status) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = status;
    button.setAttribute("aria-pressed", String(preferences.items[find.id] === status));
    button.addEventListener("click", () => {
      preferences.items[find.id] = preferences.items[find.id] === status ? "" : status;
      localStorage.setItem("rainOrShineBazaarPreferences", JSON.stringify(preferences));
      rerender();
    });
    actions.appendChild(button);
  });

  card.append(art, body, actions);
  return card;
}

function loadDashboardBazaarPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("rainOrShineBazaarPreferences")) || {};
    return {
      search: saved.search || "",
      category: saved.category || "all",
      sort: saved.sort || "featured",
      items: saved.items && typeof saved.items === "object" ? saved.items : {},
    };
  } catch {
    return { search: "", category: "all", sort: "featured", items: {} };
  }
}

function formatBazaarPrice(value) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
  });
}

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
  renderTravelSummary();
  renderMemberBreakdown();
  renderNearbyTargetSightings();
  renderBirderTypeBadges();
  renderProfileTrophyCase();
  renderTeamSpeciesTable();
  renderTeamTargetsTable();
  renderSpeciesTable();
  renderMap();
}

function speciesGroups() {
  const groups = new Map();
  observations.filter(isLifeListEligible).forEach((obs) => {
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
  document.querySelector("#teamLifeListerScore").textContent = getTeamLifeListerScore();
}

function getTeamLifeListerScore() {
  return defaultMembers.reduce((total, member) => total + getMemberLifeListCount(member), 0);
}

function getMemberLifeListCount(member) {
  const canonicalCount = getUniqueLifeListSpecies(member).length;
  const override = memberLifeListDisplayOverrides[normalizeMemberName(member)];
  return override?.canonicalCount === canonicalCount ? override.displayCount : canonicalCount;
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
    const memberSpeciesCount = getMemberLifeListCount(member);
    const card = document.createElement("article");
    card.className = "member-card";
    card.innerHTML = `
      <strong>${member}</strong>
      <span class="member-card__stats">
        <span>${memberSpeciesCount} Life Listers</span>
        <span>${memberObservations.length} Observations</span>
      </span>
    `;
    memberBreakdown.appendChild(card);
  });
}

function renderTravelSummary() {
  const travel = estimateTeamTravelMiles();
  teamTravelMiles.textContent = `${travel.miles.toLocaleString()} miles`;
  teamTravelVisits.textContent = travel.visits.toLocaleString();
  teamTravelTrips.textContent = travel.trips.toLocaleString();
  teamTravelMeta.textContent = travel.visits
    ? `Estimated from ${travel.visits.toLocaleString()} dated location visits, with multi-day trips routed together from Morton.`
    : "Estimated team trail from Morton, Illinois.";
}

function estimateTeamTravelMiles() {
  const visits = getTeamTravelVisits();
  const trips = groupTeamTravelVisits(visits);
  const miles = trips.reduce((total, trip) => total + estimateTripMiles(trip), 0);
  return {
    miles: Math.round(miles / 10) * 10,
    visits: visits.length,
    trips: trips.length,
  };
}

function getTeamTravelVisits() {
  const visits = new Map();
  observations
    .filter((obs) => obs.date && obs.latitude !== null && obs.longitude !== null)
    .forEach((obs) => {
      const key = `${obs.date}|${obs.latitude.toFixed(3)}|${obs.longitude.toFixed(3)}`;
      if (!visits.has(key)) {
        visits.set(key, {
          date: obs.date,
          latitude: obs.latitude,
          longitude: obs.longitude,
          location: obs.location || "Unlisted place",
          members: new Set(),
        });
      }
      visits.get(key).members.add(normalizeMemberName(obs.member));
    });

  return [...visits.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.location.localeCompare(b.location);
  });
}

function groupTeamTravelVisits(visits) {
  const trips = [];
  visits.forEach((visit) => {
    const currentTrip = trips[trips.length - 1];
    if (!currentTrip) {
      trips.push([visit]);
      return;
    }

    const previous = currentTrip[currentTrip.length - 1];
    const gapDays = daysBetween(previous.date, visit.date);
    const legMiles = distanceMiles(previous, visit);
    const previousFromHome = distanceMiles(MORTON_HOME, previous);
    const visitFromHome = distanceMiles(MORTON_HOME, visit);
    const sameDay = gapDays === 0;
    const continuesLongTrip =
      gapDays <= 4 && Math.max(previousFromHome, visitFromHome) >= 100 && legMiles <= 650;

    if (sameDay || continuesLongTrip) {
      currentTrip.push(visit);
    } else {
      trips.push([visit]);
    }
  });
  return trips;
}

function estimateTripMiles(trip) {
  const ordered = orderTripVisits(trip);
  let miles = 0;
  let previous = MORTON_HOME;
  ordered.forEach((visit) => {
    miles += distanceMiles(previous, visit);
    previous = visit;
  });
  return miles + distanceMiles(previous, MORTON_HOME);
}

function orderTripVisits(trip) {
  const byDate = new Map();
  trip.forEach((visit) => {
    if (!byDate.has(visit.date)) byDate.set(visit.date, []);
    byDate.get(visit.date).push(visit);
  });

  const ordered = [];
  let previous = MORTON_HOME;
  [...byDate.keys()].sort().forEach((date) => {
    const remaining = [...byDate.get(date)];
    while (remaining.length) {
      remaining.sort((a, b) => distanceMiles(previous, a) - distanceMiles(previous, b));
      previous = remaining.shift();
      ordered.push(previous);
    }
  });
  return ordered;
}

function distanceMiles(a, b) {
  const earthRadiusMiles = 3958.8;
  const latitudeA = degreesToRadians(a.latitude);
  const latitudeB = degreesToRadians(b.latitude);
  const latitudeDelta = degreesToRadians(b.latitude - a.latitude);
  const longitudeDelta = degreesToRadians(b.longitude - a.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(haversine));
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function daysBetween(dateA, dateB) {
  const start = new Date(`${dateA}T00:00:00Z`);
  const end = new Date(`${dateB}T00:00:00Z`);
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function renderNearbyTargetSightings() {
  nearbyTargetsList.innerHTML = "";
  if (!nearbyTargetSightings.length) {
    nearbyTargetsList.innerHTML =
      '<p class="nearby-targets__empty">Fresh nearby target birds will perch here when the eBird scout checks in.</p>';
    return 0;
  }

  const seenBySpecies = new Map(speciesGroups().map((group) => [getSpeciesId(group), group.members]));
  const candidates = nearbyTargetSightings
    .map((sighting) => {
      const seenBy = seenBySpecies.get(getSpeciesId(sighting)) || new Set();
      const neededBy = teamSpeciesMembers.filter((member) => !seenBy.has(member));
      return { ...sighting, seenBy: [...seenBy], neededBy };
    })
    .filter((sighting) => sighting.neededBy.length)
    .sort((a, b) => {
      if (a.neededBy.length !== b.neededBy.length) return a.neededBy.length - b.neededBy.length;
      return (b.date || "").localeCompare(a.date || "");
    });

  const targetSpecies = new Set();
  const targets = candidates
    .filter((sighting) => {
      const speciesId = getSpeciesId(sighting);
      if (targetSpecies.has(speciesId)) return false;
      targetSpecies.add(speciesId);
      return true;
    })
    .slice(0, 6);

  if (!targets.length) {
    nearbyTargetsList.innerHTML =
      '<p class="nearby-targets__empty">Every recent nearby bird is already Team Complete. That is a lovely problem.</p>';
    return 0;
  }

  targets.forEach((target) => {
    const card = document.createElement("article");
    card.className = "nearby-target";
    const photoLink = document.createElement("a");
    photoLink.className = "nearby-target__photo";
    photoLink.href = target.url || "#";
    photoLink.target = target.url ? "_blank" : "";
    photoLink.rel = target.url ? "noopener noreferrer" : "";
    photoLink.setAttribute("aria-label", `View ${target.species} report`);
    if (!target.url) photoLink.removeAttribute("href");

    const body = document.createElement("div");
    body.className = "nearby-target__body";
    const speciesLink = document.createElement(target.url ? "a" : "strong");
    speciesLink.className = "nearby-target__name";
    speciesLink.textContent = target.species;
    if (target.url) {
      speciesLink.href = target.url;
      speciesLink.target = "_blank";
      speciesLink.rel = "noopener noreferrer";
    }
    const location = document.createElement("span");
    location.textContent = target.location || "eBird location";
    const recency = document.createElement("span");
    recency.className = "nearby-target__recency";
    recency.textContent = target.date ? formatDate(target.date) : "Recently reported";
    if (target.date) recency.title = formatRelativeObservationDate(target.date);
    body.append(speciesLink, location, recency);

    const neededBy = document.createElement("span");
    neededBy.className = "needed-by";
    neededBy.setAttribute("aria-label", `Needed by ${target.neededBy.join(", ")}`);
    const neededLabel = document.createElement("small");
    neededLabel.className = "needed-by__label";
    neededLabel.textContent = "Needs";
    card.innerHTML = `
      ${target.neededBy
        .map(
          (member) =>
            `<i class="needed-by__initial needed-by__initial--${getMemberColorClass(member)}" title="${escapeHtml(member)} needs this bird">${escapeHtml(member[0])}</i>`
        )
        .join("")}
    `;
    neededBy.append(neededLabel, ...card.childNodes);
    card.replaceChildren(photoLink, body, neededBy);
    nearbyTargetsList.appendChild(card);
    loadTargetBirdPhoto(target, photoLink);
  });
  return targets.length;
}

function formatRelativeObservationDate(dateValue) {
  const observed = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(observed.getTime())) return `Reported ${dateValue}`;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const ageDays = Math.max(0, Math.round((todayUtc - observed.getTime()) / 86_400_000));
  if (ageDays === 0) return "Reported today";
  if (ageDays === 1) return "Reported yesterday";
  return `Reported ${ageDays} days ago`;
}

async function loadTargetBirdPhoto(target, photoLink) {
  const titles = [...new Set([target.species, target.scientific].filter(Boolean))];
  for (const title of titles) {
    try {
      const response = await fetchWithTimeout(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: { Accept: "application/json" } },
        6000
      );
      if (!response.ok) continue;
      const page = await response.json();
      const imageUrl = page.thumbnail?.source || page.originalimage?.source;
      if (!imageUrl) continue;
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = `${target.species} reference photo`;
      image.loading = "lazy";
      image.decoding = "async";
      photoLink.href = page.content_urls?.desktop?.page || target.url || "#";
      photoLink.title = "Reference photo from Wikimedia";
      photoLink.replaceChildren(image);
      return;
    } catch {
      // Keep the illustrated bird placeholder if Wikimedia is unavailable.
    }
  }
}

async function loadNearbyTargetSightings({ announce = false } = {}) {
  const endpoint = window.RSB_NEARBY_TARGETS_ENDPOINT || "";
  if (!endpoint) {
    nearbyTargetsStatus.textContent = "Live site feature";
    nearbyTargetsMeta.textContent = "The eBird scout checks in on the published site.";
    return;
  }

  nearbyTargetsRefreshButton.disabled = true;
  if (announce) nearbyTargetsStatus.textContent = "Checking eBird...";

  try {
    const querySeparator = endpoint.includes("?") ? "&" : "?";
    const requestUrl = `${endpoint}${querySeparator}version=20260728-2${announce ? `&refresh=${Date.now()}` : ""}`;
    const response = await fetchWithTimeout(requestUrl, {}, 15000);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.sightings)) {
      const error = new Error(data.error || "The nearby eBird scout did not respond.");
      error.setupRequired = Boolean(data.setupRequired);
      throw error;
    }

    nearbyTargetSightings = data.sightings;
    const targetCount = renderNearbyTargetSightings();
    nearbyTargetsStatus.textContent = `${targetCount} team ${targetCount === 1 ? "target" : "targets"}`;
    nearbyTargetsMeta.textContent = data.checkedAt
      ? `eBird reports within 30 miles over the last 30 days. Checked ${formatDateTime(data.checkedAt)}.`
      : "eBird reports within 30 miles over the last 30 days.";
  } catch (error) {
    nearbyTargetsStatus.textContent = error.setupRequired ? "eBird key needed" : "Scout resting";
    nearbyTargetsMeta.textContent = error.setupRequired
      ? "Add the free eBird API key in Netlify to turn on live nearby targets."
      : "The live eBird scout is resting. Try the refresh button in a moment.";
  } finally {
    nearbyTargetsRefreshButton.disabled = false;
  }
}

function renderAdventureFinds(sections = adventureFinds) {
  Object.entries(adventureLists).forEach(([category, list]) => {
    list.innerHTML = "";
    (sections[category] || []).slice(0, 7).forEach((event) => {
      const card = document.createElement("a");
      card.className = "adventure-card";
      card.href = event.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML = `
        <span>${escapeHtml([event.region, event.dateLabel].filter(Boolean).join(" | "))}</span>
        <strong>${escapeHtml(event.title)}</strong>
        <p>${escapeHtml(event.note)}</p>
      `;
      list.appendChild(card);
    });
  });
}

function setupAmbientSound() {
  if (!ambienceToggle || !ambienceToggleLabel) return;

  ambienceToggle.addEventListener("click", async () => {
    if (ambientAudioContext) {
      stopAmbientSound();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      ambienceToggleLabel.textContent = "Sound unavailable";
      ambienceToggle.disabled = true;
      return;
    }

    try {
      ambientAudioContext = new AudioContextClass();
      await ambientAudioContext.resume();
      startLightRain(ambientAudioContext);
      scheduleBirdChirp();
      ambienceToggle.setAttribute("aria-pressed", "true");
      ambienceToggleLabel.textContent = "Ambience on";
    } catch {
      stopAmbientSound();
      ambienceToggleLabel.textContent = "Try sound again";
    }
  });

  window.addEventListener("pagehide", stopAmbientSound);
}

function startLightRain(context) {
  ambientMasterGain = context.createGain();
  ambientMasterGain.gain.value = 0.72;
  ambientMasterGain.connect(context.destination);

  const rainBed = createPinkRainBuffer(context, 5);
  [
    { high: 260, low: 2200, gain: 0.026, rate: 0.91 },
    { high: 700, low: 3900, gain: 0.012, rate: 1.07 },
  ].forEach((layer) => {
    const source = context.createBufferSource();
    const highPass = context.createBiquadFilter();
    const lowPass = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = rainBed;
    source.loop = true;
    source.playbackRate.value = layer.rate;
    highPass.type = "highpass";
    highPass.frequency.value = layer.high;
    lowPass.type = "lowpass";
    lowPass.frequency.value = layer.low;
    gain.gain.value = layer.gain;
    source.connect(highPass).connect(lowPass).connect(gain).connect(ambientMasterGain);
    source.start(context.currentTime, Math.random() * 3);
    ambientRainSources.push({ source, gain });
  });

  scheduleRainDrops();
  scheduleRainSwell();
}

function createPinkRainBuffer(context, seconds) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[index] = pink * 0.085;
  }
  return buffer;
}

function scheduleRainDrops() {
  if (!ambientAudioContext) return;
  ambientRainDropTimer = window.setTimeout(() => {
    const drops = 1 + Math.floor(Math.random() * 3);
    for (let index = 0; index < drops; index += 1) {
      playRainDrop(index * (0.035 + Math.random() * 0.06));
    }
    scheduleRainDrops();
  }, 180 + Math.random() * 520);
}

function playRainDrop(delay = 0) {
  const context = ambientAudioContext;
  if (!context || context.state === "closed" || !ambientMasterGain) return;
  const now = context.currentTime + delay;
  const duration = 0.045 + Math.random() * 0.08;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
  const frequency = 1100 + Math.random() * 2200;

  oscillator.type = Math.random() > 0.5 ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.58, now + duration);
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.0025 + Math.random() * 0.0045, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  if (panner) {
    panner.pan.value = Math.random() * 1.5 - 0.75;
    oscillator.connect(filter).connect(gain).connect(panner).connect(ambientMasterGain);
  } else {
    oscillator.connect(filter).connect(gain).connect(ambientMasterGain);
  }
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function scheduleRainSwell() {
  if (!ambientAudioContext || !ambientRainSources.length) return;
  ambientRainSwellTimer = window.setTimeout(() => {
    const now = ambientAudioContext.currentTime;
    ambientRainSources.forEach(({ gain }, index) => {
      const target = index === 0 ? 0.021 + Math.random() * 0.01 : 0.009 + Math.random() * 0.007;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + 3.5);
    });
    scheduleRainSwell();
  }, 4500 + Math.random() * 3500);
}

function scheduleBirdChirp() {
  if (!ambientAudioContext) return;
  ambientBirdTimer = window.setTimeout(() => {
    playBirdChirp();
    scheduleBirdChirp();
  }, 2800 + Math.random() * 4800);
}

function playBirdChirp() {
  const context = ambientAudioContext;
  if (!context || context.state === "closed" || !ambientMasterGain) return;
  const now = context.currentTime;
  const calls = [playRobinPhrase, playWarblerTrill, playChickadeeCall, playDoveCoo];
  calls[Math.floor(Math.random() * calls.length)](context, now);
}

function playRobinPhrase(context, now) {
  [1680, 2050, 1810, 2320].forEach((frequency, index) => {
    playBirdTone(context, now + index * 0.17, frequency, frequency * 1.12, 0.13, 0.017, "triangle");
  });
}

function playWarblerTrill(context, now) {
  const base = 2500 + Math.random() * 350;
  for (let index = 0; index < 7; index += 1) {
    const frequency = base + (index % 2 ? 520 : 0);
    playBirdTone(context, now + index * 0.072, frequency, frequency * 0.84, 0.055, 0.011, "sine");
  }
}

function playChickadeeCall(context, now) {
  playBirdTone(context, now, 2250, 1840, 0.24, 0.014, "sine");
  [0.34, 0.45, 0.56].forEach((offset, index) => {
    playBirdTone(context, now + offset, 2850 + index * 120, 2450, 0.085, 0.012, "triangle");
  });
}

function playDoveCoo(context, now) {
  playBirdTone(context, now, 430, 390, 0.38, 0.013, "sine");
  playBirdTone(context, now + 0.42, 365, 335, 0.3, 0.011, "sine");
  playBirdTone(context, now + 0.77, 405, 355, 0.36, 0.009, "sine");
}

function playBirdTone(context, now, startFrequency, endFrequency, duration, volume, type) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  filter.type = "lowpass";
  filter.frequency.value = Math.max(1100, startFrequency * 1.55);
  filter.Q.value = 0.65;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.035, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  if (panner) {
    panner.pan.value = Math.random() * 1.4 - 0.7;
    oscillator.connect(filter).connect(gain).connect(panner).connect(ambientMasterGain);
  } else {
    oscillator.connect(filter).connect(gain).connect(ambientMasterGain);
  }
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function stopAmbientSound() {
  if (ambientBirdTimer) window.clearTimeout(ambientBirdTimer);
  if (ambientRainDropTimer) window.clearTimeout(ambientRainDropTimer);
  if (ambientRainSwellTimer) window.clearTimeout(ambientRainSwellTimer);
  ambientBirdTimer = null;
  ambientRainDropTimer = null;
  ambientRainSwellTimer = null;
  ambientRainSources.forEach(({ source }) => {
    try {
      source.stop();
    } catch {
      // It may already be stopped as the audio context closes.
    }
  });
  ambientRainSources = [];
  ambientMasterGain = null;
  if (ambientAudioContext && ambientAudioContext.state !== "closed") ambientAudioContext.close();
  ambientAudioContext = null;
  if (ambienceToggle && ambienceToggleLabel) {
    ambienceToggle.setAttribute("aria-pressed", "false");
    ambienceToggleLabel.textContent = "Rain + birds";
  }
}

async function loadAdventureFinds({ announce = false } = {}) {
  const endpoint = window.RSB_TOURS_ENDPOINT || "";
  if (!endpoint) {
    adventureStatus.textContent = "Curated calendars";
    adventureMeta.textContent = "Live link checking begins on the published site.";
    return;
  }

  adventureRefreshButton.disabled = true;
  if (announce) adventureStatus.textContent = "Checking the calendars...";

  try {
    const querySeparator = endpoint.includes("?") ? "&" : "?";
    const requestUrl = `${endpoint}${querySeparator}version=20260728-2${announce ? `&refresh=${Date.now()}` : ""}`;
    const response = await fetchWithTimeout(requestUrl, {}, 15000);
    const data = await response.json();
    const sections = data.sections || (Array.isArray(data.tours) ? { ...adventureFinds, birding: data.tours } : null);
    if (!response.ok || !sections) throw new Error(data.error || "Adventure scout did not return any events.");

    renderAdventureFinds(sections);
    const count = Object.values(sections).reduce((total, events) => total + events.length, 0);
    adventureStatus.textContent = `${count} trail leads`;
    adventureMeta.textContent = data.checkedAt
      ? `Official pages checked ${formatDateTime(data.checkedAt)}. Dates can change, so confirm before traveling.`
      : "Fresh leads from official event and expedition pages.";
  } catch (error) {
    renderAdventureFinds();
    adventureStatus.textContent = "Curated calendars";
    adventureMeta.textContent = "Live checking is resting; the saved official event links are still ready to explore.";
  } finally {
    adventureRefreshButton.disabled = false;
  }
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
      const lifeListCount = getMemberLifeListCount(member);
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
          uniqueSpecies: lifeListCount,
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
  const lifeListCount = getMemberLifeListCount(member);
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
  const speciesRatio = lifeListCount / Math.max(memberObservations.length, 1);

  if (hasWarbler && lifeListCount >= 75) {
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
  if (speciesRatio > 0.72 && lifeListCount >= 25) {
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
        <span class="profile-card__count">${getMemberLifeListCount(member)}</span>
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
      authStatus.textContent = "Magic link sent. Open it on this device; the shared flock will load automatically.";
    } catch (error) {
      authStatus.textContent = `Sign-in failed: ${error.message}`;
    }
  });

  signOutButton.addEventListener("click", async () => {
    const accessToken = authSession?.access_token;
    if (accessToken && hasSupabaseConfig()) {
      await fetch(`${appConfig.supabaseUrl}/auth/v1/logout`, {
        method: "POST",
        headers: supabaseHeaders(true),
      }).catch(() => null);
    }
    clearAuthSession();
    updateAuthStatus();
    updateSyncStatus();
    updateCloudButtons();
  });
}

function setupAutoSync() {
  const refreshIfDue = () => {
    if (!document.hidden && navigator.onLine && isRemoteReady && Date.now() - lastRemoteSyncAt > AUTO_SYNC_MIN_GAP_MS) {
      syncRemoteData({ quiet: true });
    }
  };

  window.addEventListener("focus", refreshIfDue);
  window.addEventListener("online", () => {
    syncStatus.textContent = "Back online. Refreshing the shared flock...";
    refreshIfDue();
  });
  window.addEventListener("offline", () => {
    syncStatus.textContent = "Offline for now. Uploads stay in this browser until the connection returns.";
  });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === BADGE_STORAGE_KEY) {
      observations = loadObservations();
      userMilestoneBadges = loadMilestoneBadgeStore();
      render();
    }
  });
  document.addEventListener("visibilitychange", refreshIfDue);
  window.setInterval(refreshIfDue, AUTO_SYNC_INTERVAL_MS);
}

async function publishLocalDataToCloud() {
  if (!isRemoteReady || !(await ensureFreshSession())) {
    syncStatus.textContent = "Sign in with a magic link before publishing saved data to the team cloud.";
    updateCloudButtons();
    return;
  }

  if (!observations.length) {
    syncStatus.textContent = "There is no saved browser data to publish yet.";
    updateCloudButtons();
    return;
  }

  const confirmed = window.confirm(
    "Publish this browser's saved bird data to the shared team database? This will replace each included birder's current cloud list."
  );
  if (!confirmed) return;

  publishLocalDataButton.disabled = true;
  refreshSharedDataButton.disabled = true;
  syncStatus.textContent = "Publishing saved browser data to the shared team cloud...";

  try {
    const members = [...new Set(observations.map((obs) => normalizeMemberName(obs.member)))];
    for (const member of members) {
      const memberRows = observations.filter((obs) => normalizeMemberName(obs.member) === member);
      const synced = await saveImport(member, "Saved browser data", memberRows, { reloadAfterSave: false, quiet: true });
      if (!synced) throw new Error(`${member}'s list could not be published.`);
    }

    await syncRemoteData({ force: true, preserveLocalWhenRemoteEmpty: false });
    syncStatus.textContent = `Published ${observations.length} observations to the shared team cloud. Everyone should see this after sign-in and refresh.`;
  } catch (error) {
    syncStatus.textContent = `Publish failed: ${error.message}`;
  } finally {
    publishLocalDataButton.disabled = false;
    refreshSharedDataButton.disabled = false;
    updateCloudButtons();
  }
}

async function initRemoteData() {
  await loadRemoteConfig();
  applyAuthHash();
  if (hasStoredAuthSession()) await ensureFreshSession();
  updateAuthStatus();
  updateSyncStatus();

  if (!isRemoteReady) return;

  await syncRemoteData();
}

async function syncRemoteData(options = {}) {
  const { force = false, quiet = false, preserveLocalWhenRemoteEmpty = true } = options;
  if (!isRemoteReady) {
    updateSyncStatus();
    return;
  }

  if (remoteSyncPromise) return remoteSyncPromise;

  remoteSyncPromise = performRemoteSync({ force, quiet, preserveLocalWhenRemoteEmpty });
  try {
    return await remoteSyncPromise;
  } finally {
    remoteSyncPromise = null;
  }
}

async function performRemoteSync({ force, quiet, preserveLocalWhenRemoteEmpty }) {
  if (!(await ensureFreshSession())) {
    updateAuthStatus();
    updateSyncStatus();
    return;
  }

  if (force && !quiet) syncStatus.textContent = "Refreshing shared team data...";

  try {
    const [observationRows, badgeRows, rosterRows] = await Promise.all([
      remoteSelect("observations"),
      remoteSelect("user_milestone_badges"),
      remoteSelect("team_members"),
    ]);
    const remoteObservations = observationRows.map(fromRemoteObservation);
    const remoteBadges = badgeRows.map(fromRemoteBadge);
    signedInMemberName = rosterRows[0]?.display_name || signedInMemberName;

    if (remoteObservations.length || !preserveLocalWhenRemoteEmpty) {
      observations = remoteObservations;
      userMilestoneBadges = remoteBadges;
    }

    saveObservations();
    saveMilestoneBadgeStore();
    render();
    updateAuthStatus();
    lastRemoteSyncAt = Date.now();
    if (remoteObservations.length) {
      syncStatus.textContent = `Shared flock current: ${remoteObservations.length.toLocaleString()} observations. Updated ${formatSyncTime(lastRemoteSyncAt)}.`;
    } else {
      syncStatus.textContent =
        observations.length && preserveLocalWhenRemoteEmpty
          ? `Signed in, but the shared database is empty. This browser has ${observations.length} saved observations ready to publish.`
          : "Signed in, but the shared database returned 0 observations. Upload or publish saved data to share it across devices.";
    }
    updateCloudButtons();
    scheduleMapRefresh();
  } catch (error) {
    syncStatus.textContent = `Signed in, but shared data could not load. ${error.message}`;
    updateCloudButtons();
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
      supabaseUrl: normalizeSupabaseProjectUrl(config.supabaseUrl || ""),
      supabaseAnonKey: config.supabaseAnonKey || "",
    };
  } catch (error) {
    syncStatus.textContent = `Config not loaded yet. ${error.message}`;
  }

  isRemoteReady = hasSupabaseConfig() && hasStoredAuthSession();
  updateCloudButtons();
}

function applyAuthHash() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(location.search.replace(/^\?/, ""));
  const accessToken = hash.get("access_token") || search.get("access_token");
  const refreshToken = hash.get("refresh_token") || search.get("refresh_token");
  const expiresIn = Number(hash.get("expires_in") || search.get("expires_in") || 3600);
  const authError = hash.get("error_description") || search.get("error_description") || hash.get("error") || search.get("error");

  if (accessToken) {
    persistAuthSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
      expires_at: Date.now() + expiresIn * 1000,
    });
    authNotice = "Signed in successfully. Loading the shared flock now.";
    history.replaceState(null, "", location.pathname);
  } else if (authError) {
    authNotice = `Sign-in link failed: ${authError}`;
    history.replaceState(null, "", location.pathname);
  }
}

function updateAuthStatus() {
  const configured = hasSupabaseConfig();
  signOutButton.hidden = !authSession;
  const memberName = getSignedInMemberName();
  welcomeMessage.textContent = memberName ? `Welcome, ${memberName}.` : "Welcome, whimsical birder.";

  if (authNotice) {
    authStatus.textContent = authNotice;
  } else if (!configured) {
    authStatus.textContent = "Connect Supabase to enable shared team data.";
  } else if (authSession) {
    authStatus.textContent = "Signed in. Uploads, milestones, and team analysis sync to the shared database.";
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
    syncStatus.textContent = "Signed in. Loading shared team data...";
  }
  updateCloudButtons();
}

function updateCloudButtons() {
  refreshSharedDataButton.disabled = !isRemoteReady;
  publishLocalDataButton.disabled = !isRemoteReady || !observations.length;
  publishLocalDataButton.textContent = observations.length
    ? `Publish this browser's data (${observations.length})`
    : "Publish this browser's data";
}

function normalizeSupabaseProjectUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/auth\/v1\/?$/i, "")
    .replace(/\/+$/g, "");
}

function hasStoredAuthSession() {
  return Boolean(authSession?.access_token || authSession?.refresh_token);
}

function persistAuthSession(session) {
  const expiresIn = Number(session.expires_in || 3600);
  const rawExpiresAt = Number(session.expires_at || 0);
  const expiresAt = rawExpiresAt
    ? rawExpiresAt > 10_000_000_000
      ? rawExpiresAt
      : rawExpiresAt * 1000
    : Date.now() + expiresIn * 1000;
  authSession = {
    access_token: session.access_token || authSession?.access_token || "",
    refresh_token: session.refresh_token || authSession?.refresh_token || "",
    expires_at: expiresAt,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authSession));
  isRemoteReady = hasSupabaseConfig() && hasStoredAuthSession();
}

function clearAuthSession(notice = "") {
  authSession = null;
  authNotice = notice;
  signedInMemberName = "";
  isRemoteReady = false;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function ensureFreshSession({ force = false } = {}) {
  if (!hasSupabaseConfig() || !hasStoredAuthSession()) return false;
  const hasTime = Number(authSession.expires_at || 0) - Date.now() > 60 * 1000;
  if (!force && authSession.access_token && hasTime) {
    isRemoteReady = true;
    return true;
  }

  if (!authSession.refresh_token) {
    clearAuthSession("Your sign-in expired. Send yourself a fresh magic link to reconnect.");
    return false;
  }

  if (sessionRefreshPromise) return sessionRefreshPromise;
  sessionRefreshPromise = refreshAuthSession();
  try {
    return await sessionRefreshPromise;
  } finally {
    sessionRefreshPromise = null;
  }
}

async function refreshAuthSession() {
  try {
    const response = await fetchWithTimeout(
      `${appConfig.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: supabaseHeaders(false),
        body: JSON.stringify({ refresh_token: authSession.refresh_token }),
      },
      15000
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      throw new Error(data.msg || data.error_description || data.error || "Session refresh failed.");
    }

    persistAuthSession(data);
    authNotice = "";
    updateAuthStatus();
    updateCloudButtons();
    return true;
  } catch (error) {
    clearAuthSession("Your sign-in expired. Send yourself a fresh magic link to reconnect.");
    updateAuthStatus();
    updateCloudButtons();
    return false;
  }
}

function getSignedInMemberName() {
  if (signedInMemberName) return signedInMemberName;
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
      const response = await fetchWithTimeout(
        endpoint,
        {
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
        },
        30000
      );
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || `Assistant request failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      assistantStatus.textContent = "Connected";
      return data.reply || data.output_text || "I received the request, but no reply text came back.";
    } catch (error) {
      assistantStatus.textContent = "Local helper";
      if (error.status === 429 && /quota|credit|billing/i.test(error.message)) {
        return `The live birding assistant is resting because the OpenAI API project needs credits. The shared lists, maps, targets, and tour scout still work normally. For now: ${getDemoAssistantReply(message, image)}`;
      }
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
  return "I can still help organize bird ID clues, compare field marks, shape eBird notes, and sketch a Rain or Shine trip plan in local helper mode.";
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
    .filter(isLifeListEligible)
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
  const taxonId = normalizeKey(obs.scientific || obs.species);
  return lifeListTaxonAliases[taxonId] || taxonId;
}

function isLifeListEligible(obs) {
  const taxonId = normalizeKey(obs.scientific || obs.species);
  return Boolean(taxonId) && !lifeListExcludedTaxa.has(taxonId);
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
      <td>${group.members.size === teamSpeciesMembers.length ? '<span class="team-complete-badge" title="All three birders have recorded this species">Team Complete</span>' : ""}</td>
    `;
    teamSpeciesTable.appendChild(row);
  });
}

function renderTeamTargetsTable() {
  const targets = getTeamTargetSpecies();
  teamTargetsTable.innerHTML = "";
  teamTargetsEmpty.style.display = targets.length ? "none" : "block";

  targets.forEach((target) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${escapeHtml(target.species)}</strong>${target.scientific ? `<br><span class="scientific">${escapeHtml(target.scientific)}</span>` : ""}</td>
      <td>${formatMemberDotList(target.seenBy)}</td>
      <td>${escapeHtml(target.neededBy.join(", "))}</td>
      <td><span class="target-pill">${escapeHtml(target.neededBy.length === 1 ? "One away" : "Team target")}</span></td>
    `;
    teamTargetsTable.appendChild(row);
  });
}

function getTeamTargetSpecies() {
  return speciesGroups()
    .map((group) => {
      const seenBy = teamSpeciesMembers.filter((member) => group.members.has(member));
      const neededBy = teamSpeciesMembers.filter((member) => !group.members.has(member));
      return { ...group, seenBy, neededBy };
    })
    .filter((group) => group.seenBy.length > 0 && group.neededBy.length > 0)
    .sort((a, b) => {
      if (a.neededBy.length !== b.neededBy.length) return a.neededBy.length - b.neededBy.length;
      return a.species.localeCompare(b.species);
    });
}

function formatMemberDotList(members) {
  return `<span class="dot-list">${members
    .map((member) => `<span class="seen-dot seen-dot--${getMemberColorClass(member)}" title="${escapeHtml(member)}"></span>`)
    .join("")}</span>`;
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

async function saveImport(member, sourceName, imported, options = {}) {
  const { reloadAfterSave = true, quiet = false } = options;
  saveObservations();
  updateCloudButtons();

  if (!isRemoteReady || !(await ensureFreshSession())) {
    syncStatus.textContent = `Saved ${imported.length} rows locally. Sign in after Supabase is connected to sync shared data.`;
    updateCloudButtons();
    return false;
  }

  try {
    await remoteReplaceMemberObservations(member, sourceName, imported);

    if (reloadAfterSave) {
      await syncRemoteData({ force: true, preserveLocalWhenRemoteEmpty: false });
      syncStatus.textContent = `Synced ${imported.length} ${member} observations to Supabase and refreshed shared team data.`;
    } else if (!quiet) {
      syncStatus.textContent = `Synced ${imported.length} ${member} observations to Supabase.`;
    }
    return true;
  } catch (error) {
    syncStatus.textContent = `Saved locally, but Supabase sync failed: ${error.message}`;
    return false;
  } finally {
    updateCloudButtons();
  }
}

async function syncMilestoneBadges() {
  const speciesBadges = userMilestoneBadges.filter((badge) => badge.badge_kind === "species");
  if (!isRemoteReady || !speciesBadges.length || !(await ensureFreshSession())) return;
  try {
    await remoteUpsert("user_milestone_badges", speciesBadges.map(toRemoteBadge), "id");
  } catch (error) {
    syncStatus.textContent = `Badge sync failed: ${error.message}`;
  }
}

async function supabaseAuthRequest(path, body) {
  const response = await fetchWithTimeout(
    `${appConfig.supabaseUrl}/auth/v1${path}`,
    {
      method: "POST",
      headers: supabaseHeaders(false),
      body: JSON.stringify(body),
    },
    15000
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || data.error_description || data.error || response.statusText);
  }
  return response.json().catch(() => ({}));
}

async function remoteSelect(table) {
  const rows = [];
  let offset = 0;

  while (true) {
    const response = await authorizedFetch(`${appConfig.supabaseUrl}/rest/v1/${table}?select=*`, {
      method: "GET",
      headers: {
        Range: `${offset}-${offset + REMOTE_PAGE_SIZE - 1}`,
        "Range-Unit": "items",
        Prefer: "count=exact",
      },
    });
    if (response.status === 416) break;
    const page = await parseSupabaseResponse(response);
    rows.push(...page);
    const total = Number.parseInt((response.headers.get("content-range") || "").split("/")[1], 10);
    if (!page.length || (Number.isFinite(total) && rows.length >= total)) break;
    offset += page.length;
  }

  return rows;
}

async function remoteReplaceMemberObservations(member, sourceName, imported) {
  const response = await authorizedFetch(`${appConfig.supabaseUrl}/rest/v1/rpc/replace_member_observations`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      p_member_name: normalizeMemberName(member),
      p_source_name: sourceName,
      p_observations: imported.map((obs) => toRemoteObservation(obs, null)),
    }),
  });
  return parseSupabaseResponse(response);
}

async function remoteUpsert(table, rows, conflictColumn) {
  const response = await authorizedFetch(`${appConfig.supabaseUrl}/rest/v1/${table}?on_conflict=${conflictColumn}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
  return parseSupabaseResponse(response);
}

async function authorizedFetch(url, options = {}, retryAuth = true) {
  if (!(await ensureFreshSession())) throw new Error("Your sign-in has expired. Send a fresh magic link to reconnect.");
  const response = await fetchWithTimeout(
    url,
    {
      ...options,
      headers: { ...supabaseHeaders(true), ...(options.headers || {}) },
    },
    20000
  );

  if (response.status === 401 && retryAuth && authSession?.refresh_token) {
    const refreshed = await ensureFreshSession({ force: true });
    if (refreshed) return authorizedFetch(url, options, false);
  }
  return response;
}

async function parseSupabaseResponse(response) {
  const text = await response.text();
  let data = [];
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
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
  const isSmallScreen = window.matchMedia("(max-width: 620px)").matches;
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
      zoomControl: false,
    }).setView([39.5, -98.35], 4);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    }).addTo(birdMap);
    addExpeditionMapControls(birdMap);
  }

  if (birdMapLayer) birdMapLayer.remove();
  birdMapSelectedMarker = null;
  birdMapLayer = createBirdMapLayer(isSmallScreen).addTo(birdMap);
  if (!points.length) {
    birdMapBounds = [];
    return;
  }

  const locationGroups = aggregateMapLocations(points);
  const bounds = [];
  locationGroups.forEach((location) => {
    const marker = L.marker([location.latitude, location.longitude], {
      icon: createMapMarkerIcon(location.members, isSmallScreen),
      keyboard: true,
      riseOnHover: true,
      title: createMapMarkerAriaLabel(location),
      alt: createMapMarkerAriaLabel(location),
    });
    marker.bindPopup(buildMapFieldNote(location), {
      className: "field-note-popup",
      maxWidth: isSmallScreen ? 270 : 310,
      minWidth: isSmallScreen ? 230 : 250,
      autoPan: true,
      autoPanPaddingTopLeft: [24, 72],
      autoPanPaddingBottomRight: [24, 40],
      keepInView: true,
      closeButton: true,
    });

    marker.on("add", () => {
      const element = marker.getElement();
      if (!element) return;
      element.setAttribute("aria-label", createMapMarkerAriaLabel(location));
      element.setAttribute("role", "button");
    });
    marker.on("click", () => selectMapMarker(marker));
    marker.on("popupclose", () => {
      if (birdMapSelectedMarker === marker) {
        marker.getElement()?.classList.remove("is-selected");
        birdMapSelectedMarker = null;
      }
    });

    if (supportsHover) {
      marker.bindTooltip(buildMapFieldNote(location), {
        className: "field-note-tooltip",
        direction: "auto",
        offset: [0, -22],
        opacity: 1,
        interactive: true,
        sticky: true,
      });
      marker.on("tooltipopen", () => marker.getElement()?.classList.add("is-hovered"));
      marker.on("tooltipclose", () => {
        marker.getElement()?.classList.remove("is-hovered");
      });
    }

    birdMapLayer.addLayer(marker);
    bounds.push([location.latitude, location.longitude]);
  });

  fitMapToBounds(bounds);
}

function createBirdMapLayer(isSmallScreen) {
  if (typeof L.markerClusterGroup !== "function") return L.layerGroup();

  const clusterLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: false,
    removeOutsideVisibleBounds: true,
    maxClusterRadius: isSmallScreen ? 42 : 50,
    disableClusteringAtZoom: 13,
    iconCreateFunction: createMapClusterIcon,
  });
  clusterLayer.on("clusterclick", (event) => {
    event.layer.zoomToBounds({
      paddingTopLeft: isSmallScreen ? [32, 66] : [42, 52],
      paddingBottomRight: isSmallScreen ? [32, 34] : [76, 42],
      maxZoom: 13,
    });
  });
  return clusterLayer;
}

function createMapClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const sizeClass = count >= 50 ? "large" : count >= 15 ? "medium" : "small";
  const size = sizeClass === "large" ? 58 : sizeClass === "medium" ? 52 : 46;
  return L.divIcon({
    className: `expedition-cluster expedition-cluster--${sizeClass}`,
    html: `
      <span class="expedition-cluster__nest" role="img" aria-label="${count} locations in this cluster">
        <i aria-hidden="true"></i>
        <strong>${count}</strong>
      </span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function addExpeditionMapControls(map) {
  const ExpeditionControls = L.Control.extend({
    options: { position: "topright" },
    onAdd() {
      const container = L.DomUtil.create("div", "leaflet-bar expedition-map-controls");
      const makeButton = (label, symbol, title, handler) => {
        const button = L.DomUtil.create("button", "expedition-map-control", container);
        button.type = "button";
        button.setAttribute("aria-label", label);
        button.title = title;
        button.textContent = symbol;
        L.DomEvent.on(button, "click", L.DomEvent.stop);
        L.DomEvent.on(button, "click", handler);
        return button;
      };

      makeButton("Zoom in", "+", "Zoom in", () => map.zoomIn());
      makeButton("Zoom out", "\u2212", "Zoom out", () => map.zoomOut());
      makeButton("Fit the full expedition trail", "\u2316", "Fit the full expedition trail", fitBirdMapToTrail);
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      return container;
    },
  });

  new ExpeditionControls().addTo(map);
}

function fitBirdMapToTrail() {
  if (!birdMap || !birdMapBounds.length) return;
  const isSmallScreen = window.matchMedia("(max-width: 620px)").matches;
  birdMap.fitBounds(birdMapBounds, {
    paddingTopLeft: isSmallScreen ? [32, 66] : [42, 52],
    paddingBottomRight: isSmallScreen ? [32, 34] : [76, 42],
    maxZoom: 12,
    animate: true,
  });
}

function createMapMarkerIcon(members, isSmallScreen) {
  const descriptor = getMapMarkerDescriptor(members);
  const width = isSmallScreen ? 46 : 40;
  const height = isSmallScreen ? 52 : 46;
  return L.divIcon({
    className: `expedition-marker expedition-marker--${descriptor.className}`,
    html: `
      <span class="expedition-marker__pin" aria-hidden="true">
        ${descriptor.svg}
      </span>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 4],
    popupAnchor: [0, -(height - 10)],
  });
}

function getMapMarkerDescriptor(members) {
  if (members.length >= 3) {
    return {
      className: "shared-three",
      svg: `
        <svg viewBox="0 0 28 28">
          <path d="M7 22h14M10 20c-1.7-4.4.1-7.5 4-10.4 3.9 2.9 5.7 6 4 10.4M10.5 16.5h7M14 9.5V5m-2.5 2.5L14 5l2.5 2.5" />
        </svg>
      `,
    };
  }
  if (members.length === 2) {
    return {
      className: "shared-two",
      svg: `
        <svg viewBox="0 0 28 28">
          <circle cx="8.5" cy="16.5" r="4.5" />
          <circle cx="19.5" cy="16.5" r="4.5" />
          <path d="M12.8 16.5h2.4M7 12l2-5h3l2 6m7-1-2-5h-3l-2 6" />
        </svg>
      `,
    };
  }

  const member = normalizeMemberName(members[0]);
  if (member === "Matt") {
    return {
      className: "matt",
      svg: `
        <svg viewBox="0 0 28 28">
          <path d="M6 18c7.5 0 9.5-8.5 16-8-1.5 6-5.5 10-12 10l-3 3m10-10 4-1.5M11 20v3" />
          <circle cx="18.5" cy="11.7" r=".7" />
        </svg>
      `,
    };
  }
  if (member === "Jeff") {
    return {
      className: "jeff",
      svg: `
        <svg viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="8.5" />
          <path d="m17.5 10.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
        </svg>
      `,
    };
  }
  return {
    className: "alex",
    svg: `
      <svg viewBox="0 0 28 28">
        <path d="M21 7c-8 .2-13 4.4-13 10.5 0 2.3 1.4 3.8 3.7 3.8C17.8 21.3 21 15 21 7Z" />
        <path d="M7 23c2.5-5 5.7-8.2 10.2-10.6" />
      </svg>
    `,
  };
}

function createMapMarkerAriaLabel(location) {
  const visitors = location.members.length ? location.members.join(", ") : "the team";
  return `${location.location || "Birding location"}, visited by ${visitors}; ${location.visitCount} visit${
    location.visitCount === 1 ? "" : "s"
  }, ${location.speciesCount} species`;
}

function buildMapFieldNote(location) {
  const locationName = location.location || "Unknown place";
  const visitors = location.members.length ? location.members.join(", ") : "Rain or Shine team";
  const firstVisit = location.firstVisit ? formatDate(location.firstVisit) : "Not recorded";
  const latestVisit = location.latestVisit ? formatDate(location.latestVisit) : "Not recorded";
  const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude.toFixed(5)}&mlon=${location.longitude.toFixed(
    5
  )}#map=14/${location.latitude.toFixed(5)}/${location.longitude.toFixed(5)}`;

  return `
    <article class="map-field-note">
      <p class="map-field-note__eyebrow">${escapeHtml(location.label)}</p>
      <h3>${escapeHtml(locationName)}</h3>
      <p class="map-field-note__visitors">Field team: <strong>${escapeHtml(visitors)}</strong></p>
      <dl>
        <div><dt>Visits</dt><dd>${location.visitCount}</dd></div>
        <div><dt>Species</dt><dd>${location.speciesCount}</dd></div>
        <div><dt>First</dt><dd>${escapeHtml(firstVisit)}</dd></div>
        <div><dt>Latest</dt><dd>${escapeHtml(latestVisit)}</dd></div>
      </dl>
      <a href="${mapUrl}" target="_blank" rel="noopener noreferrer">View this location</a>
    </article>
  `;
}

function selectMapMarker(marker) {
  if (birdMapSelectedMarker && birdMapSelectedMarker !== marker) {
    birdMapSelectedMarker.getElement()?.classList.remove("is-selected");
  }
  birdMapSelectedMarker = marker;
  marker.getElement()?.classList.add("is-selected");
}

function fitMapToBounds(bounds) {
  birdMapBounds = bounds;
  const isSmallScreen = window.matchMedia("(max-width: 620px)").matches;
  const fit = () => {
    birdMap.invalidateSize();
    birdMap.fitBounds(bounds, {
      paddingTopLeft: isSmallScreen ? [32, 66] : [42, 52],
      paddingBottomRight: isSmallScreen ? [32, 34] : [76, 42],
      maxZoom: 12,
    });
  };
  fit();
  window.setTimeout(fit, 180);
  window.setTimeout(fit, 650);
}

function scheduleMapRefresh() {
  window.requestAnimationFrame(() => {
    if (birdMap) birdMap.invalidateSize();
    renderMap();
  });
}

function aggregateMapLocations(points) {
  const groups = new Map();
  points.forEach((point) => {
    const key = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
    if (!groups.has(key)) {
      groups.set(key, {
        latitude: point.latitude,
        longitude: point.longitude,
        location: point.location || "Unknown place",
        members: new Set(),
        count: 0,
        species: new Set(),
        visits: new Set(),
        dates: new Set(),
      });
    }
    const group = groups.get(key);
    group.members.add(normalizeMemberName(point.member));
    group.count += 1;
    group.species.add(getSpeciesId(point));
    group.visits.add(point.checklist || point.date || point.id);
    if (point.date) group.dates.add(point.date);
  });

  return [...groups.values()].map((group) => {
    const members = teamSpeciesMembers.filter((member) => group.members.has(member));
    const dates = [...group.dates].sort();
    return {
      ...group,
      members,
      visitCount: group.visits.size,
      speciesCount: group.species.size,
      firstVisit: dates[0] || "",
      latestVisit: dates[dates.length - 1] || "",
      label: members.length === 3 ? "Team outing location" : members.length === 2 ? "Shared birding location" : members[0] || "Birding location",
    };
  });
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
    if (!session?.access_token && !session?.refresh_token) return null;
    return session;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("The request took too long. Please try again.");
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatSyncTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
