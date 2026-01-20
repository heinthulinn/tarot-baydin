// /api/tarot.js

function normalizeLanguage(lang) {
  if (!lang) return "en";

  lang = lang.toLowerCase();

  if (lang === "my" || lang === "my-mm" || lang === "burmese" || lang === "myanmar")
    return "my";

  if (lang === "th" || lang === "th-th" || lang === "thai")
    return "th";

  if (lang === "ja" || lang === "ja-jp" || lang === "japanese")
    return "ja";

  if (lang === "zh" || lang.startsWith("zh"))
    return "zh";

  if (lang === "ko" || lang === "ko-kr")
    return "ko";

  if (lang === "vi" || lang === "vi-vn")
    return "vi";

  return "en";
}

function getLanguageInstruction(lang) {
  switch (lang) {
    case "my":
      return `
You MUST respond ONLY in Myanmar (Burmese) language.
Use proper Myanmar Unicode script.
DO NOT use English.
DO NOT mix languages.
`;
    case "th":
      return `
You MUST respond ONLY in Thai language.
DO NOT use English.
`;
    case "ja":
      return `
You MUST respond ONLY in Japanese language.
DO NOT use English.
`;
    case "zh":
      return `
You MUST respond ONLY in Chinese language.
DO NOT use English.
`;
    case "ko":
      return `
You MUST respond ONLY in Korean language.
DO NOT use English.
`;
    case "vi":
      return `
You MUST respond ONLY in Vietnamese language.
DO NOT use English.
`;
    default:
      return `
Respond in English.
`;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cards, question, language } = req.body;

  if (!cards || !question || !language) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const normalizedLang = normalizeLanguage(language);
  const languageInstruction = getLanguageInstruction(normalizedLang);

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        messages: [
          {
            role: "system",
            content: `
You are a professional tarot reader.
Speak in a mystical, calm, and insightful tone.
${languageInstruction}
Do not mention you are an AI.
`
          },
          {
            role: "user",
            content: `
Tarot cards: ${cards.join(", ")}
Question: ${question}
`
          }
        ]
      })
    });

    const data = await response.json();

    console.log("XAI RAW RESPONSE:", JSON.stringify(data));

    const aiText =
      data?.choices?.[0]?.message?.content ??
      "The cards are silent right now. Please try again.";

    return res.status(200).json({
      success: true,
      result: aiText
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      result: "Tarot spirits failed to respond."
    });
  }
}
