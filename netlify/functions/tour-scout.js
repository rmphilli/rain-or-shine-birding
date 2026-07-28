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
      title: "Goatman Festival",
      region: "Louisville, Kentucky",
      dateLabel: "Oct 15-18, 2026",
      note: "A free cryptid gathering with Bigfoot researchers, special tours, films, music, and a creature market.",
      url: "https://goatmanfest.com/",
      expiresAt: "2026-10-20",
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
      title: "Lake Superior Paranormal Convention",
      region: "Thunder Bay, Ontario",
      dateLabel: "Oct 16-17, 2026",
      note: "Speakers, workshops, and an optional after-dark investigation at Fort William.",
      url: "https://www.lakesuperiorparacon.com/tickets",
      expiresAt: "2026-10-19",
    },
    {
      title: "Halifax Paranormal Symposium",
      region: "Halifax, Nova Scotia",
      dateLabel: "Oct 2026",
      note: "Two days of paranormal research, workshops, vendors, psychics, and curious minds.",
      url: "https://www.hfxparanormal.com/",
      expiresAt: "2026-11-02",
    },
    {
      title: "Extraterrestrials: Conscious Universe",
      region: "Prague or live stream",
      dateLabel: "Nov 13-15, 2026",
      note: "An international conference on UFOs, contact, consciousness, history, and spirituality.",
      url: "https://www.ufokonference.cz/en/",
      expiresAt: "2026-11-17",
    },
  ],
};

exports.handler = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const sections = {};

  await Promise.all(
    Object.entries(EVENT_SOURCES).map(async ([category, sources]) => {
      const candidates = sources.filter((event) => event.expiresAt >= today);
      const checks = await Promise.all(candidates.map(checkEventSource));
      const ordered = checks.filter((event) => event.reachable).concat(checks.filter((event) => !event.reachable));
      sections[category] = ordered.slice(0, 4).map(({ reachable, expiresAt, ...event }) => event);
    })
  );

  return json(200, {
    sections,
    checkedAt: new Date().toISOString(),
  });
};

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
