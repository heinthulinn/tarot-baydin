// /api/tarot.js
export default async function handler(req, res) {

  // ✅ CORS (FIRST THING)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ keep this check AFTER OPTIONS
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 👇 all your tarot logic stays EXACTLY the same below
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
  
    // ✅ NEW INPUT MODEL
    const {
      name,
      dob,
      sex,
      category,
      customQuestion,
      cards,
      language
    } = req.body;
  
    // ✅ STRONG VALIDATION
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
      return res.status(400).json({
        success: false,
        result: "Missing required fields"
      });
    }
  
    const normalizedLang = normalizeLanguage(language);
    const targetLanguageName = getLanguageName(normalizedLang);
  
    try {
      // =========================
      // STEP 1: TAROT DESTINY READ
      // =========================
      const tarotText = await callXAI([
        {
          role: "system",
          content: `
  You are an ancient Tarot Master and Destiny Oracle.
  
  You are a spiritual guide who interprets tarot cards, birth energy,
  life paths, destiny flow, and soul lessons.
  
  RULES:
  - Never say you are an AI
  - Never mention models, APIs, or systems
  - Speak in mystical, calm, wise language
  - No disclaimers
  - No technical explanations
  
  OUTPUT STRUCTURE:
  1. 🧍 Personal Energy Reading
  2. 🃏 Tarot Card Interpretation
  3. 🌙 Destiny Path
  4. 🔮 Hidden Influences
  5. ⚠️ Warnings
  6. ✨ Guidance
  7. 🧭 Direction Forward
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
  
  Selected Tarot Cards:
  ${cards.join(", ")}
  
  Interpret this destiny using ancient tarot wisdom.
  `
        }
      ]);
  
      if (!tarotText) {
        throw new Error("Empty tarot response");
      }
  
      // =========================
      // STEP 2: TRANSLATION
      // =========================
      let finalText = tarotText;
  
      if (normalizedLang !== "en") {
        const translated = await callXAI([
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
  
        if (translated) finalText = translated;
      }
  
      // =========================
      // RESPONSE
      // =========================
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
}




