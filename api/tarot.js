// /api/tarot.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  console.log("🔥 /tarot HIT");
  console.log("METHOD:", req.method);

  // =========================
  // CORS (MUST BE FIRST)
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("🟡 OPTIONS preflight");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("❌ Invalid method");
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("HEADERS:", req.headers);
  console.log("BODY:", req.body);

  // =========================
  // HELPERS
  // =========================
  function normalizeLanguage(lang) {
    if (!lang) return "en";
    lang = lang.toLowerCase();

    if (lang === "my" || lang === "my-mm" || lang === "burmese" || lang === "myanmar") return "my";
    if (lang === "th" || lang === "th-th" || lang === "thai") return "th";
    if (lang === "ja" || lang === "ja-jp" || lang === "japanese") return "ja";
    if (lang === "zh" || lang.startsWith("zh")) return "zh";
    if (lang === "ko" || lang === "ko-kr") return "ko";
    if (lang === "vi" || lang === "vi-vn") return "vi";

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
    console.log("📡 Calling XAI API...");

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

    console.log("📡 XAI status:", response.status);

    const data = await response.json();
    console.log("📡 XAI raw response:", data);

    return data?.choices?.[0]?.message?.content || "";
  }

  // =========================
  // INPUT
  // =========================
  const {
    name,
    dob,
    sex,
    category,
    customQuestion,
    cards,
    language
  } = req.body || {};

  // =========================
  // VALIDATION
  // =========================
  if (
    !name ||
    !dob ||
    !sex ||
    !category ||
    !cards ||
    !Array.isArray(cards) ||
    cards.length === 0 ||
    !language
  ) {
    console.log("❌ Validation failed");
    return res.status(400).json({
      success: false,
      result: "Missing required fields"
    });
  }

  const normalizedLang = normalizeLanguage(language);
  const targetLanguageName = getLanguageName(normalizedLang);

  try {
    console.log("🃏 Generating tarot reading...");

    const tarotText = await callXAI([
      {
        role: "system",
        content: `
You are an ancient Tarot Master and Destiny Oracle.

IMPORTANT:
- Respond ONLY in ${targetLanguageName}
- Do NOT include English
`
      },
      {
        role: "user",
        content: `
Name: ${name}
Date of Birth: ${dob}
Sex: ${sex}
Life Category: ${category}
Question: ${customQuestion || "No specific question"}
Cards: ${cards.join(", ")}
`
      }
    ]);

    if (!tarotText) {
      throw new Error("Empty tarot response");
    }

    console.log("✅ Tarot success");

    return res.status(200).json({
      success: true,
      result: tarotText
    });

  } catch (err) {
    console.error("❌ TAROT ERROR:", err);
    return res.status(500).json({
      success: false,
      result: "Tarot spirits failed to respond."
    });
  }
}
