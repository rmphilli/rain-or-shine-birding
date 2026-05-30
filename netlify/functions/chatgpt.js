exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Use POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, { error: "OPENAI_API_KEY is not configured in Netlify." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const message = String(payload.message || "Please help identify this bird.").slice(0, 4000);
  const image = payload.image && payload.image.dataUrl ? payload.image : null;
  const content = [
    {
      type: "input_text",
      text: [
        "You are the Rain or Shine Birding Team assistant.",
        "Help with bird identification, field marks, eBird notes, trip planning, and friendly general birding chat.",
        "For image IDs, give likely candidates, confidence, key field marks, and what details would improve the ID.",
        "Be concise, practical, and careful about uncertainty.",
        `User message: ${message}`,
      ].join("\n"),
    },
  ];

  if (image) {
    content.push({
      type: "input_image",
      image_url: image.dataUrl,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        input: [{ role: "user", content }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || "OpenAI request failed." });
    }

    return json(200, {
      reply: data.output_text || collectOutputText(data) || "I could not find a text response.",
    });
  } catch (error) {
    return json(500, { error: error.message || "Assistant request failed." });
  }
};

function collectOutputText(data) {
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((part) => part.type === "output_text" && part.text)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
