const PROHIBITED_EVENT_TOPICS =
  /\b(?:astrology|demon(?:ic|ology)?|exorcism|ghost(?:ly)?|goatman|haunt(?:ed|ing)?|mediumship|necromancy|occult|pagan(?:ism)?|psychic medium|ritual|satan(?:ic|ism)?|s[eé]ance|spell(?:craft)?|spiritualism|tarot|wicca(?:n)?|witch(?:craft|es)?)\b/i;
const ALLOWED_ALIEN_AND_PSI_TOPICS =
  /\b(?:alien|extraterrestrial|mindsight|precognition|psi|psychokinesis|remote viewing|seti|uap|ufo)\b/i;

const EVENT_SOURCES = {
  birding: [
    {
      title: "Fall WPBO Birding Tours",
      region: "Whitefish Point, Michigan",
      dateLabel: "Sep 12-13 or Oct 3-4, 2026",
      note: "Small-group fall migration weekends with Michigan Audubon at Whitefish Point.",
      url: "https://www.michiganaudubon.org/upcoming-trips-workshops/",
      expiresAt: "2026-10-05",
    },
    {
      title: "Shorebirding Weekend Adventure",
      region: "Illinois River Valley",
      dateLabel: "Aug 22-23, 2026",
      note: "A guided weekend focused on shorebirds, waterfowl, and whatever else turns up.",
      url: "https://illinoisaudubon.org/blog/field-trip/shorebirding-weekend-adventure-8-22-23-26/",
      expiresAt: "2026-08-25",
    },
    {
      title: "Fall Migration: Chicago Lakefront Focus",
      region: "Chicago, Illinois",
      dateLabel: "Sep 9, 2026",
      note: "A compact guided morning at Jarvis Bird Sanctuary with fall warblers squarely in view.",
      url: "https://illinoisaudubon.org/blog/field-trip/fall-migration-chicago-lakefront-focus-9-9-26/",
      expiresAt: "2026-09-11",
    },
    {
      title: "Michigan: Hotspots & Warblers",
      region: "Michigan",
      dateLabel: "May 12-20, 2027",
      note: "A small-group migration circuit with Tawas, Kirtland's Warbler country, and Whitefish Point.",
      url: "https://fieldguides.com/bird-tours/michigan/",
      expiresAt: "2027-05-22",
    },
    {
      title: "Shorebirding Mid-Week Adventure",
      region: "Central Illinois River Valley",
      dateLabel: "Aug 20-21, 2026",
      note: "Two guided weekdays among Illinois River shorebirds, waterfowl, and migration surprises.",
      url: "https://illinoisaudubon.org/blog/field-trip/shorebirding-mid-week-adventure-8-20-21-26/",
      expiresAt: "2026-08-23",
    },
    {
      title: "Fall Migration: Chicago Lakefront Focus",
      region: "Chicago, Illinois",
      dateLabel: "Sep 16, 2026",
      note: "A second small-group lakefront morning timed for fall migrants at Jarvis Bird Sanctuary.",
      url: "https://illinoisaudubon.org/blog/field-trip/fall-migration-chicago-lakefront-focus-9-16-2026-2/",
      expiresAt: "2026-09-18",
    },
    {
      title: "Dixon Waterfowl Refuge Fall Birding",
      region: "Hennepin, Illinois",
      dateLabel: "Oct 24, 2026",
      note: "A guided fall outing with Doug Stotz across wetland, prairie, and woodland habitat.",
      url: "https://illinoisaudubon.org/blog/field-trip/dixon-waterfowl-refuge-fall-birding-adventure-with-doug-stotz-10-24-26/",
      expiresAt: "2026-10-26",
    },
  ],
  bigfoot: [
    {
      title: "Ohio BFRO Expedition",
      region: "Ohio field location",
      dateLabel: "Sep 17-20 or Oct 15-18, 2026",
      note: "A multi-night BFRO field expedition with basecamp and nighttime teams in active Ohio areas.",
      url: "https://www.bfro.net/news/roundup/ohio.asp",
      expiresAt: "2026-10-20",
    },
    {
      title: "Wisconsin BFRO Expedition",
      region: "Wisconsin Driftless Area",
      dateLabel: "Oct 1-4, 2026",
      note: "A guided nighttime field expedition in one of Wisconsin's most active report areas.",
      url: "https://www.bfro.net/news/roundup/wisconsin.asp",
      expiresAt: "2026-10-06",
    },
    {
      title: "Indiana Bigfoot Conference",
      region: "Nashville, Indiana",
      dateLabel: "Sep 25-26, 2026",
      note: "Firsthand encounters, researchers, and local makers at The Seasons Lodge.",
      url: "https://www.indianabigfootconference.com/",
      expiresAt: "2026-09-28",
    },
    {
      title: "Illinois BFRO Expedition",
      region: "Illinois field location",
      dateLabel: "Sep 10-13, 2026",
      note: "A multi-night BFRO expedition with field teams, nighttime observation, and a nearby Illinois basecamp.",
      url: "https://bfro.net/news/roundup/expeds_2026.asp",
      expiresAt: "2026-09-15",
    },
    {
      title: "Missouri BFRO Expedition",
      region: "Missouri field location",
      dateLabel: "Oct 22-25, 2026",
      note: "A guided fall expedition in an active Missouri report area with organized nighttime teams.",
      url: "https://bfro.net/news/roundup/expeds_2026.asp",
      expiresAt: "2026-10-27",
    },
    {
      title: "New York Bigfoot Conference",
      region: "New York",
      dateLabel: "Oct 3, 2026",
      note: "A one-day gathering of investigators, witnesses, speakers, and curious cryptid-minded travelers.",
      url: "https://nybigfootconference.com/event-tickets/",
      expiresAt: "2026-10-05",
    },
  ],
  paranormal: [
    {
      title: "Psi Games International",
      region: "Schedule announcement pending",
      dateLabel: "2026",
      note: "Friendly competitions in remote viewing, intuition, psychokinesis, and other psi skills.",
      url: "https://psigamesinternational.com/",
      expiresAt: "2026-12-31",
    },
    {
      title: "IRVA Remote Viewing Conference",
      region: "Dayton, Ohio",
      dateLabel: "Oct 2026",
      note: "Three days of remote viewing research, practical experiments, and shared learning.",
      url: "https://www.irvaconference.com/",
      expiresAt: "2026-11-02",
    },
    {
      title: "Exeter UFO Festival",
      region: "Exeter, New Hampshire",
      dateLabel: "Sep 5-6, 2026",
      note: "A community UFO weekend built around the historic Exeter sighting, speakers, and skyward curiosity.",
      url: "https://exeterufofestival.org/",
      expiresAt: "2026-09-08",
    },
    {
      title: "IAC SETI Symposium",
      region: "Antalya, Turkiye",
      dateLabel: "Oct 5-9, 2026",
      note: "A scientific SETI symposium within the International Astronautical Congress, focused on the search for extraterrestrial intelligence.",
      url: "https://www.iac2026.org/iac-2026",
      expiresAt: "2026-10-12",
    },
    {
      title: "MUFON International Symposium",
      region: "Covington, Kentucky",
      dateLabel: "Aug 27-30, 2026",
      note: "A major UFO research gathering with investigators, case studies, speakers, and skyward questions.",
      url: "https://mufonsymposium.com/",
      expiresAt: "2026-09-01",
    },
    {
      title: "IFEX SETI & UAP Conference",
      region: "Wurzburg, Germany",
      dateLabel: "Sep 23-24, 2026",
      note: "A university-hosted scientific conference focused on SETI, UAP research, methods, and evidence.",
      url: "https://www.uni-wuerzburg.de/ifex/veranstaltungen/ifex-seti-uap-konferenz-2026/",
      expiresAt: "2026-09-26",
    },
  ],
};

exports.handler = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const sections = {};

  await Promise.all(
    Object.entries(EVENT_SOURCES).map(async ([category, sources]) => {
      const candidates = sources.filter(
        (event) => event.expiresAt >= today && isEventAllowed(event, category)
      );
      const checks = await Promise.all(candidates.map(checkEventSource));
      const ordered = checks.filter((event) => event.reachable).concat(checks.filter((event) => !event.reachable));
      sections[category] = ordered.slice(0, 7).map(({ reachable, expiresAt, ...event }) => event);
    })
  );

  return json(200, {
    sections,
    checkedAt: new Date().toISOString(),
  });
};

function isEventAllowed(event, category) {
  const searchableText = [event.title, event.region, event.dateLabel, event.note, event.url]
    .filter(Boolean)
    .join(" ");
  if (PROHIBITED_EVENT_TOPICS.test(searchableText)) return false;
  return category !== "paranormal" || ALLOWED_ALIEN_AND_PSI_TOPICS.test(searchableText);
}

async function checkEventSource(event) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(event.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Rain-or-Shine-Adventure-Scout/2.0",
      },
    });
    return { ...event, reachable: response.status < 500 };
  } catch {
    return { ...event, reachable: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
    },
    body: JSON.stringify(body),
  };
}
