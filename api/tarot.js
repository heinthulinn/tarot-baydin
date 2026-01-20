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

function getLanguageName(lang) {
  switch (lang) {
    case "my": return "Myanmar (Burmese)";
    case "th": return "Thai";
    case "ja": return "Japanese";
    case "zh": return "Chinese";
    case "ko": return "Korean";
    case "vi": return "Vietnamese";
    default: return "English";
  }
}

async function callXAI(messages) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-4-latest",
      messages
    })
  });

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
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
  const targetLanguageName = getLanguageName(normalizedLang);

  try {
    // ---------- STEP 1: Generate tarot reading (English OK)
    const tarotText = await callXAI([
      {
        role: "system",
        content: `
You are a professional tarot reader.
Speak in a mystical, calm, and insightful tone.
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
    ]);

    if (!tarotText) {
      throw new Error("Empty tarot response");
    }

    // ---------- STEP 2: Translate if needed
    let finalText = tarotText;

    if (normalizedLang !== "en") {
      finalText = await callXAI([
        {
          role: "system",
          content: `
You are a professional translator.
Translate the text into ${targetLanguageName}.

RULES:
- Output ONLY the translated text
- Use correct native Unicode script
- Do NOT add explanations
- Do NOT include English
`
        },
        {
          role: "user",
          content: tarotText
        }
      ]);
    }

    return res.status(200).json({
      success: true,
      result: finalText
    });

  } catch (err) {
    console.error("TAROT ERROR:", err);
    return res.status(500).json({
      success: false,
      result: "Tarot spirits failed to respond."
    });
  }
}
