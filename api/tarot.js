// import fetch from "node-fetch";

export default async function tarotHandler(req, res) {
  const requestStart = Date.now();

  // =========================
  // BASIC VALIDATION
  // =========================
  const { name, dob, sex, category, customQuestion, cards, language } = req.body || {};

  if (!name || !dob || !sex || !category || !Array.isArray(cards) || !language) {
    return res.status(400).json({ success: false, result: "Missing required fields" });
  }

  // =========================
  // SERVER LOG (USER REQUEST)
  // =========================
  console.log("🧑 USER REQUEST", {
    name,
    dob,
    sex,
    category,
    cards,
    language,
    time: new Date().toISOString()
  });

  if (!process.env.XAI_API_KEY) {
    return res.status(500).json({ success: false, result: "API key missing" });
  }

  try {
    // =================================================
    // STEP 1 — TAROT READING (ENGLISH ONLY)
    // =================================================
    const tarotResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        temperature: 0.6,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "You are a professional Tarot Master. Give a clear tarot reading in ENGLISH ONLY. No translation. No emojis. 2 short paragraphs."
          },
          {
            role: "user",
            content: `Name: ${name}
DOB: ${dob}
Sex: ${sex}
Category: ${category}
Question: ${customQuestion || "None"}
Cards: ${cards.join(", ")}`
          }
        ]
      })
    });

    if (!tarotResponse.ok) {
      const t = await tarotResponse.text();
      throw new Error("Tarot API failed: " + t);
    }

    const tarotData = await tarotResponse.json();
    const englishReading = tarotData?.choices?.[0]?.message?.content?.trim();

    if (!englishReading) throw new Error("Empty tarot result");

    // =================================================
    // STEP 2 — TRANSLATION (ONLY IF NEEDED)
    // =================================================
    let finalResult = englishReading;

    if (language.toLowerCase() !== "en") {
      const translateResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.XAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-4-1-fast-non-reasoning",
          temperature: 0,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content:
                "Translate the following text exactly. Do NOT add meaning. Do NOT interpret."
            },
            {
              role: "user",
              content: `Translate into ${language}:\n\n${englishReading}`
            }
          ]
        })
      });

      if (!translateResponse.ok) {
        const t = await translateResponse.text();
        throw new Error("Translation failed: " + t);
      }

      const translateData = await translateResponse.json();
      finalResult = translateData?.choices?.[0]?.message?.content?.trim();
    }

    // =========================
    // FINAL LOG
    // =========================
    const duration = Date.now() - requestStart;
    console.log(`✅ TAROT DONE in ${duration}ms`);

    return res.status(200).json({
      success: true,
      result: finalResult
    });

  } catch (err) {
    console.error("❌ TAROT ERROR FULL:", err);
    return res.status(500).json({
      success: false,
      result: err.message || "Tarot service failed"
    });
  }
}
