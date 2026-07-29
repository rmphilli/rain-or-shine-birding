const BAZAAR_STORAGE_KEY = "rainOrShineBazaarPreferences";
const BAZAAR_SESSION_KEY = "rainOrShineBazaarView";
const TEAM_SESSION_KEY = "rainOrShineSupabaseSession";

const fallbackBazaarFinds = [
  {
    id: "storm-notebook",
    monogram: "FN",
    name: "Stormproof Field Notebook",
    category: "field-tools",
    categoryLabel: "Field tools",
    vendor: "Mock Fieldhouse stall",
    price: 18,
    discount: 20,
    description:
      "Pocket notes that keep their composure through a soft Morton downpour.",
  },
  {
    id: "binocular-harness",
    monogram: "BH",
    name: "Quiet-Step Binocular Harness",
    category: "optics",
    categoryLabel: "Optics",
    vendor: "Mock Lookout stall",
    price: 39,
    discount: 15,
    description:
      "A low-profile carry system for long walks and sudden warblers.",
  },
  {
    id: "rain-shell",
    monogram: "RS",
    name: "Packable Moss Rain Shell",
    category: "rain-gear",
    categoryLabel: "Rain gear",
    vendor: "Mock Rainline stall",
    price: 89,
    discount: 25,
    description:
      "A light shower layer with enough room for field-guide pockets.",
  },
  {
    id: "warbler-guide",
    monogram: "WG",
    name: "Pocket Warbler Field Guide",
    category: "books-maps",
    categoryLabel: "Books & maps",
    vendor: "Mock Paper Nest stall",
    price: 24,
    discount: 10,
    description:
      "Quick comparisons for the tiny yellow bird that refused to hold still.",
  },
  {
    id: "trail-thermos",
    monogram: "TT",
    name: "Dawn Patrol Trail Thermos",
    category: "camp-travel",
    categoryLabel: "Camp & travel",
    vendor: "Mock Camp Kettle stall",
    price: 28,
    discount: 18,
    description:
      "A compact warm-up for cold overlooks, wet blinds, and early checklists.",
  },
  {
    id: "red-headlamp",
    monogram: "RL",
    name: "Owl-Safe Red Headlamp",
    category: "field-tools",
    categoryLabel: "Field tools",
    vendor: "Mock Nightjar stall",
    price: 32,
    discount: 12,
    description:
      "Soft red illumination for predawn setups without blasting the understory.",
  },
  {
    id: "lens-guard",
    monogram: "LG",
    name: "Binocular Lens Rain Guard",
    category: "optics",
    categoryLabel: "Optics",
    vendor: "Mock Lookout stall",
    price: 17,
    discount: 22,
    description:
      "A simple shield for keeping the next life bird clearer in a drizzle.",
  },
  {
    id: "map-case",
    monogram: "MC",
    name: "Waterproof Trail Map Case",
    category: "books-maps",
    categoryLabel: "Books & maps",
    vendor: "Mock Paper Nest stall",
    price: 14,
    discount: 8,
    description:
      "A clear field sleeve for routes, hotspots, and handwritten detours.",
  },
  {
    id: "sit-pad",
    monogram: "SP",
    name: "Packable Marsh Sit Pad",
    category: "camp-travel",
    categoryLabel: "Camp & travel",
    vendor: "Mock Camp Kettle stall",
    price: 21,
    discount: 16,
    description:
      "Dry patience for stakeouts where the bittern has its own schedule.",
  },
  {
    id: "team-patch",
    monogram: "RS",
    name: "Rain or Shine Field Patch",
    category: "team-whimsy",
    categoryLabel: "Team whimsy",
    vendor: "Mock Curious Finds stall",
    price: 12,
    discount: 5,
    description:
      "A small flock mark for packs, jackets, and improbably serious expeditions.",
  },
  {
    id: "bigfoot-pin",
    monogram: "BF",
    name: "Bigfoot Bird-Watcher Pin",
    category: "team-whimsy",
    categoryLabel: "Team whimsy",
    vendor: "Mock Curious Finds stall",
    price: 10,
    discount: 14,
    description:
      "For the team member who checks the canopy and the tree line equally.",
  },
  {
    id: "field-mug",
    monogram: "FM",
    name: "Kingfisher Enamel Field Mug",
    category: "camp-travel",
    categoryLabel: "Camp & travel",
    vendor: "Mock Camp Kettle stall",
    price: 16,
    discount: 11,
    description:
      "A cheerful camp mug for rain breaks and triumphant list recounts.",
  },
];
const bazaarFinds = Array.isArray(window["RSB_BAZAAR_FINDS"])
  ? window["RSB_BAZAAR_FINDS"]
  : [];

const bazaarElements = {
  disabled: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarDisabled")
  ),
  gate: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarAccessGate")
  ),
  gateStatus: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarGateStatus")
  ),
  experience: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarExperience")
  ),
  welcome: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarWelcome")
  ),
  search: /** @type {HTMLInputElement} */ (
    document.querySelector("#bazaarSearch")
  ),
  category: /** @type {HTMLSelectElement} */ (
    document.querySelector("#bazaarCategory")
  ),
  sort: /** @type {HTMLSelectElement} */ (
    document.querySelector("#bazaarSort")
  ),
  reset: /** @type {HTMLButtonElement} */ (
    document.querySelector("#bazaarReset")
  ),
  grid: /** @type {HTMLElement} */ (document.querySelector("#bazaarGrid")),
  empty: /** @type {HTMLElement} */ (document.querySelector("#bazaarEmpty")),
  resultCount: /** @type {HTMLElement} */ (
    document.querySelector("#bazaarResultCount")
  ),
};

let bazaarPreferences = loadBazaarPreferences();

initializeBazaar();

async function initializeBazaar() {
  if (!window["RSB_BAZAAR_ENABLED"]) {
    bazaarElements.gate.hidden = true;
    bazaarElements.disabled.hidden = false;
    return;
  }

  const localPreview =
    (location.protocol === "file:" ||
      ["localhost", "127.0.0.1"].includes(location.hostname)) &&
    new URLSearchParams(location.search).get("preview") === "1";
  if (localPreview) {
    openBazaar("Development preview");
    return;
  }

  try {
    const member = await verifyTeamAccess();
    openBazaar(member.display_name || member.email.split("@")[0]);
  } catch (error) {
    bazaarElements.gateStatus.textContent = error.message;
  }
}

function openBazaar(memberName) {
  bazaarElements.gate.hidden = true;
  bazaarElements.experience.hidden = false;
  bazaarElements.welcome.textContent = `Welcome, ${memberName}.`;
  restoreBazaarView();
  bindBazaarControls();
  renderBazaar();
}

async function verifyTeamAccess() {
  const configResponse = await fetch("/.netlify/functions/config", {
    headers: { Accept: "application/json" },
  });
  if (!configResponse.ok)
    throw new Error(
      "The team field pass could not be checked. Try again in a moment.",
    );
  const config = await configResponse.json();
  const supabaseUrl = normalizeSupabaseUrl(config.supabaseUrl);
  const anonKey = config.supabaseAnonKey || "";
  if (!supabaseUrl || !anonKey)
    throw new Error("Team access is not configured on this deployment.");

  let session = loadTeamSession();
  if (!session) throw new Error("No team sign-in was found on this device.");
  if (
    Number(session.expires_at || 0) - Date.now() < 60_000 &&
    session.refresh_token
  ) {
    session = await refreshTeamSession(
      supabaseUrl,
      anonKey,
      session.refresh_token,
    );
  }
  if (!session.access_token)
    throw new Error(
      "Your field pass expired. Send yourself a fresh magic link.",
    );

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!userResponse.ok)
    throw new Error(
      "Your field pass expired. Sign in again from the dashboard.",
    );
  const user = await userResponse.json();
  const email = String(user.email || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("This sign-in does not include a team email.");

  const rosterResponse = await fetch(
    `${supabaseUrl}/rest/v1/team_members?select=display_name,email&email=eq.${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
      },
    },
  );
  const roster = rosterResponse.ok ? await rosterResponse.json() : [];
  if (!roster.length)
    throw new Error("This field pass is not on the Rain or Shine trio roster.");
  return roster[0];
}

async function refreshTeamSession(supabaseUrl, anonKey, refreshToken) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const session = await response.json().catch(() => ({}));
  if (!response.ok || !session.access_token) {
    localStorage.removeItem(TEAM_SESSION_KEY);
    throw new Error(
      "Your field pass expired. Sign in again from the dashboard.",
    );
  }
  const expiresAt = Number(session.expires_at || 0);
  session.expires_at = expiresAt
    ? expiresAt > 10_000_000_000
      ? expiresAt
      : expiresAt * 1000
    : Date.now() + Number(session.expires_in || 3600) * 1000;
  localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(session));
  return session;
}

function bindBazaarControls() {
  bazaarElements.search.value = bazaarPreferences.search || "";
  bazaarElements.category.value = bazaarPreferences.category || "all";
  bazaarElements.sort.value = bazaarPreferences.sort || "featured";
  bazaarElements.search.addEventListener("input", updateBazaarFilters);
  bazaarElements.category.addEventListener("change", updateBazaarFilters);
  bazaarElements.sort.addEventListener("change", updateBazaarFilters);
  bazaarElements.reset.addEventListener("click", () => {
    bazaarPreferences.search = "";
    bazaarPreferences.category = "all";
    bazaarPreferences.sort = "featured";
    bazaarElements.search.value = "";
    bazaarElements.category.value = "all";
    bazaarElements.sort.value = "featured";
    saveBazaarPreferences();
    renderBazaar();
  });
  window.addEventListener("pagehide", saveBazaarView);
}

function updateBazaarFilters() {
  bazaarPreferences.search = bazaarElements.search.value.trim();
  bazaarPreferences.category = bazaarElements.category.value;
  bazaarPreferences.sort = bazaarElements.sort.value;
  saveBazaarPreferences();
  renderBazaar();
}

function renderBazaar() {
  const search = bazaarPreferences.search.toLowerCase();
  const category = bazaarPreferences.category;
  const finds = bazaarFinds
    .filter((find) => category === "all" || find.category === category)
    .filter((find) => {
      if (!search) return true;
      return [
        find.name,
        find.categoryLabel,
        find.vendor,
        find.description,
      ].some((value) => value.toLowerCase().includes(search));
    })
    .sort((a, b) => {
      if (bazaarPreferences.sort === "price-low") return a.price - b.price;
      if (bazaarPreferences.sort === "price-high") return b.price - a.price;
      if (bazaarPreferences.sort === "discount") return b.discount - a.discount;
      return bazaarFinds.indexOf(a) - bazaarFinds.indexOf(b);
    });

  bazaarElements.grid.replaceChildren(...finds.map(createBazaarCard));
  bazaarElements.empty.hidden = finds.length > 0;
  bazaarElements.resultCount.textContent = `${finds.length} verified sale ${finds.length === 1 ? "find" : "finds"}`;
}

function createBazaarCard(find) {
  const card = document.createElement("article");
  card.className = "bazaar-card";

  const art = document.createElement("div");
  art.className = "bazaar-card__art";
  const productImage = document.createElement("img");
  productImage.className = "bazaar-card__image";
  productImage.src = find.image;
  productImage.alt = find.imageAlt || find.name;
  productImage.loading = "lazy";
  productImage.decoding = "async";
  productImage.addEventListener("error", () => {
    const monogram = document.createElement("span");
    monogram.className = "bazaar-card__monogram";
    monogram.textContent = find.monogram;
    art.replaceChildren(monogram);
  });
  art.appendChild(productImage);

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
    button.setAttribute(
      "aria-pressed",
      String(bazaarPreferences.items[find.id] === status),
    );
    button.addEventListener("click", () => {
      bazaarPreferences.items[find.id] =
        bazaarPreferences.items[find.id] === status ? "" : status;
      saveBazaarPreferences();
      renderBazaar();
    });
    actions.appendChild(button);
  });

  card.append(art, body, actions);
  return card;
}

function formatBazaarPrice(value) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
  });
}

function loadBazaarPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(BAZAAR_STORAGE_KEY)) || {};
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

function saveBazaarPreferences() {
  localStorage.setItem(BAZAAR_STORAGE_KEY, JSON.stringify(bazaarPreferences));
}

function saveBazaarView() {
  sessionStorage.setItem(
    BAZAAR_SESSION_KEY,
    JSON.stringify({ scrollY: window.scrollY }),
  );
}

function restoreBazaarView() {
  try {
    const view = JSON.parse(sessionStorage.getItem(BAZAAR_SESSION_KEY));
    if (Number.isFinite(view?.scrollY))
      requestAnimationFrame(() => window.scrollTo(0, view.scrollY));
  } catch {
    // A missing view simply starts the Bazaar at the top.
  }
}

function loadTeamSession() {
  try {
    const session = JSON.parse(localStorage.getItem(TEAM_SESSION_KEY));
    return session?.access_token || session?.refresh_token ? session : null;
  } catch {
    return null;
  }
}

function normalizeSupabaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/auth\/v1\/?$/i, "")
    .replace(/\/+$/g, "");
}
