const STORAGE_KEY = "rainOrShineBirdingData";
const BADGE_STORAGE_KEY = "rainOrShineMilestoneBadges";
const SESSION_STORAGE_KEY = "rainOrShineSupabaseSession";
const defaultMembers = ["Jeff", "Alex", "Matt"];

let observations = loadObservations();
let userMilestoneBadges = loadMilestoneBadgeStore();
let appConfig = { supabaseUrl: "", supabaseAnonKey: "" };
let authSession = loadAuthSession();
let isRemoteReady = false;

const fileInputs = document.querySelectorAll(".file-input");
const speciesTable = document.querySelector("#speciesTable");
const tableEmpty = document.querySelector("#tableEmpty");
const mapEmpty = document.querySelector("#mapEmpty");
const canvas = document.querySelector("#heatMap");
const memberFilter = document.querySelector("#memberFilter");
const speciesSearch = document.querySelector("#speciesSearch");
const memberBreakdown = document.querySelector("#memberBreakdown");
const profileTrophyCase = document.querySelector("#profileTrophyCase");
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

let attachedBirdImage = null;

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

fileInputs.forEach((input) => {
  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    const member = event.target.dataset.member;
    const imported = normalizeRows(rows, member, file.name);

    observations = observations.filter((item) => item.member !== member).concat(imported);
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
