const MORTON = {
  latitude: 40.6128,
  longitude: -89.4593,
};
const SEARCH_RADIUS_KM = 48;
const DAYS_BACK = 30;

exports.handler = async () => {
  const apiKey = process.env.EBIRD_API_KEY || "";
  if (!apiKey) {
    return json(503, {
      error: "The eBird API key is not configured yet.",
      setupRequired: true,
    });
  }

  const query = new URLSearchParams({
    lat: String(MORTON.latitude),
    lng: String(MORTON.longitude),
    dist: String(SEARCH_RADIUS_KM),
    back: String(DAYS_BACK),
    hotspot: "true",
    includeProvisional: "false",
    maxResults: "1000",
    sppLocale: "en",
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://api.ebird.org/v2/data/obs/geo/recent?${query}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-eBirdApiToken": apiKey,
      },
    });
    const data = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(data)) {
      throw new Error(data.message || data.error || `eBird responded with ${response.status}.`);
    }

    const unique = new Map();
    data.forEach((observation) => {
      const key = `${observation.speciesCode || observation.sciName}|${observation.locId || observation.locName}`;
      const date = String(observation.obsDt || "").slice(0, 10);
      const current = unique.get(key);
      if (!current || date > current.date) {
        unique.set(key, {
          species: observation.comName || "Unlisted bird",
          scientific: observation.sciName || "",
          speciesCode: observation.speciesCode || "",
          date,
          location: observation.locName || "eBird location",
          locationId: observation.locId || "",
          latitude: observation.lat ?? null,
          longitude: observation.lng ?? null,
          count: observation.howMany ?? null,
          url: observation.locId ? `https://ebird.org/hotspot/${observation.locId}` : "",
        });
      }
    });

    const sightings = [...unique.values()].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.species.localeCompare(b.species);
    });

    return json(200, {
      sightings,
      checkedAt: new Date().toISOString(),
      center: MORTON,
      radiusMiles: 30,
      daysBack: DAYS_BACK,
    });
  } catch (error) {
    return json(502, {
      error: error.name === "AbortError" ? "The eBird request timed out." : error.message,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": statusCode === 200 ? "public, max-age=900, stale-while-revalidate=3600" : "no-store",
    },
    body: JSON.stringify(body),
  };
}
