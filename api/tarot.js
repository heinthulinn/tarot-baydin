// /api/tarot.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  console.log("🔥 /tarot HIT");

  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

  // =========================
  // INPUT & VALIDATION
  // =========================
  const { name, dob, sex, category, customQuestion, cards, language } = req.body || {};

  if (!name || !dob || !sex || !category || !cards || !Array.isArray(cards) || !language) {
    return res.status(400).json({ success: false, result: "Missing required fields" });
  }

  const normalizedLang = normalizeLanguage(language);
  const targetLanguageName = getLanguageName(normalizedLang);

  // Log request details
  console.log(`📋 Request: ${name} | ${category} | ${cards.length} cards | ${normalizedLang}`);

  try {
    const startTime = Date.now();
    console.log(`🃏 Starting reading for ${name}...`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        temperature: 0.7, // Slightly lower for more focused responses
        max_tokens: 1500, // Limit response length for faster generation
        messages: [
          {
            role: "system",
            content: `You are a wise Tarot Master. Give a clear, meaningful reading in ${targetLanguageName} only. 

RULES:
- Write in ${targetLanguageName} ONLY. No English.
- Keep it focused and meaningful (3-4 paragraphs max).
- Weave the cards (${cards.join(", ")}) into a flowing story, not a list.
- Address ${name}'s question about ${category}: "${customQuestion}"
- End with brief, actionable advice.
- Use ${name}'s name naturally 2-3 times.
- Be compassionate but direct.`
          },
          {
            role: "user",
            content: `I am ${name} (${dob}, ${sex}). My question: "${customQuestion}" in ${category}. Cards: ${cards.join(", ")}.`
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ X.AI API Error:", response.status, errorData);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    let tarotText = data?.choices?.[0]?.message?.content || "";

    if (!tarotText) throw new Error("Empty response from API");

    // Clean up response - remove any markdown formatting if present
    tarotText = tarotText.trim();
    
    // Limit response length if too long (safety check)
    if (tarotText.length > 3000) {
      tarotText = tarotText.substring(0, 3000) + "...";
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Reading complete (${tarotText.length} chars, ${duration}ms)`);
    return res.status(200).json({ success: true, result: tarotText });

  } catch (err) {
    console.error("❌ TAROT ERROR:", err);
    
    // More specific error messages
    let errorMessage = "The connection was interrupted. Please try again.";
    if (err.name === 'AbortError') {
      errorMessage = "The reading took too long. Please try again.";
    } else if (err.message.includes('API')) {
      errorMessage = "Service temporarily unavailable. Please try again later.";
    }
    
    return res.status(500).json({ success: false, result: errorMessage });
  }
}