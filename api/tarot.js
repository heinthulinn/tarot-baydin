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

  try {
    console.log(`🃏 Master reading for ${name}...`);

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        temperature: 0.8, // Increased for more "human" and soulful writing
        messages: [
          {
            role: "system",
            content: `
              You are a highly respected, ancient, and deeply intuitive Tarot Master and Spiritual Guide. 
              The user, ${name}, is sitting before you seeking deep truth.

              INSTRUCTIONS FOR THE MASTER:
              - Speak with compassion, authority, and mystery. 
              - Use the user's details: Name (${name}), Birth Date (${dob}), and Sex (${sex}) to personalize the reading. 
              - Calculate their astrological/numerological vibration based on their DOB to set the tone.
              - Focus deeply on their category (${category}) and their specific question: "${customQuestion}".
              - Do NOT list the cards in a boring way (e.g., "Card 1: ..."). Instead, weave them into a single, beautiful, flowing story.
              - Explain how the cards interact with each other. For example: "The energy of the first card flows into the next, showing that..."
              - Provide a final, powerful piece of "Master's Advice" at the end.

              FORMATTING RULES:
              - Respond ONLY in ${targetLanguageName}.
              - Use natural paragraphs. NO bullet points. NO English words.
              - Use the user's name throughout the reading to make it feel intimate.
            `
          },
          {
            role: "user",
            content: `Master, I am ${name}, born on ${dob} (${sex}). I seek guidance regarding my ${category}. My heart asks: "${customQuestion}". The cards drawn are: ${cards.join(", ")}.`
          }
        ]
      })
    });

    const data = await response.json();
    const tarotText = data?.choices?.[0]?.message?.content || "";

    if (!tarotText) throw new Error("Spirits are silent (Empty response)");

    console.log("✅ Deep reading complete");
    return res.status(200).json({ success: true, result: tarotText });

  } catch (err) {
    console.error("❌ TAROT ERROR:", err);
    return res.status(500).json({ success: false, result: "The connection to the spiritual realm was interrupted. Please try again." });
  }
}