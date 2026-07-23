const TOUR_SOURCES = [
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
    title: "Illinois Audubon Adventure Field Trips",
    region: "Across Illinois",
    dateLabel: "Seasonal 2026 outings",
    note: "The larger calendar includes fall migration, shorebirding, and waterfowl adventures.",
    url: "https://illinoisaudubon.org/programs/field-trips/",
    expiresAt: "2026-12-31",
  },
  {
    title: "Isle Royale & Keweenaw Peninsula",
    region: "Michigan",
    dateLabel: "Aug 21-30, 2026",
    note: "A bigger trip with birding, natural history, scenery, and a little island-adventure flavor.",
    url: "https://www.naturalistjourneys.com/tours/2026/08/21/michigan-s-isle-royale-keweenaw-peninsula",
    expiresAt: "2026-09-01",
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
    title: "Minnesota in Winter",
    region: "Minnesota",
    dateLabel: "Jan 14-19, 2027",
    note: "A northern winter expedition on the WINGS Midwest calendar, built for owls and boreal birds.",
    url: "https://wingsbirds.com/tours/regions/midwest",
    expiresAt: "2027-01-21",
  },
  {
    title: "Chicago Custom Birding Tours",
    region: "Chicago, Illinois",
    dateLabel: "Private dates available",
    note: "Flexible guided outings around Montrose Point, Jackson Park, and other Chicago hotspots.",
    url: "https://indigobirding.com/chicago-birding-tours/",
    expiresAt: "2028-12-31",
  },
  {
    title: "Wisconsin Custom Birding Tours",
    region: "Wisconsin",
    dateLabel: "Private dates available",
    note: "Custom guiding around Milwaukee, Door County, and other Wisconsin birding destinations.",
    url: "https://www.duckibirding.com/",
    expiresAt: "2028-12-31",
  },
];

exports.handler = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const candidates = TOUR_SOURCES.filter((tour) => tour.expiresAt >= today);
  const checks = await Promise.all(candidates.map(checkTourSource));
  const live = checks.filter((tour) => tour.reachable);
  const fallback = checks.filter((tour) => !tour.reachable);
  const tours = live.concat(fallback).slice(0, 7).map(({ reachable, expiresAt, ...tour }) => tour);

  return json(200, {
    tours,
    checkedAt: new Date().toISOString(),
  });
};

async function checkTourSource(tour) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(tour.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Rain-or-Shine-Birding-Tour-Scout/1.0",
      },
    });
    return { ...tour, reachable: response.status < 500 };
  } catch {
    return { ...tour, reachable: false };
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
