// import fetch from "node-fetch";

// =========================
// HELPER: AUTO-COMPLETE RESPONSE
// =========================
async function completeChat(messages, model, temperature = 0) {
  let fullText = "";
  let rounds = 0;

  while (rounds < 5) {
    rounds++;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 600,
        messages
      })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const chunk = data?.choices?.[0]?.message?.content || "";

    fullText += chunk;

    // Stop if response looks complete
    if (
      chunk.endsWith(".") ||
      chunk.endsWith("!") ||
      chunk.endsWith("?") ||
      chunk.endsWith("။")
    ) {
      break;
    }

    // Ask to continue
    messages.push({ role: "assistant", content: chunk });
    messages.push({
      role: "user",
      content: "Continue from the last sentence. Do not repeat."
    });
  }

  return fullText.trim();
}

// =========================
// MAIN HANDLER
// =========================
export default async function tarotHandler(req, res) {
  const requestStart = Date.now();

  const { name, dob, sex, category, customQuestion, cards, language } = req.body || {};

  if (!name || !dob || !sex || !category || !Array.isArray(cards) || !language) {
    return res.status(400).json({ success: false, result: "Missing required fields" });
  }

  if (!process.env.XAI_API_KEY) {
    return res.status(500).json({ success: false, result: "API key missing" });
  }

  try {
    // =========================
    // STEP 1 — TAROT (ENGLISH)
    // =========================
    const tarotMessages = [
      {
        role: "system",
        content:
          "You are a professional Tarot Master. Give a complete tarot reading in ENGLISH ONLY. No emojis. No translation. Finish all thoughts."
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
    ];

    const englishReading = await completeChat(
      tarotMessages,
      "grok-4-1-fast-non-reasoning",
      0.6
    );

    if (!englishReading) {
      throw new Error("Empty tarot result");
    }

    // =========================
    // STEP 2 — TRANSLATION
    // =========================
    let finalResult = englishReading;

    if (language.toLowerCase() !== "en") {
      const translateMessages = [
        {
          role: "system",
          content:
            "Translate the following text completely. Do NOT summarize. Preserve all paragraphs and meaning."
        },
        {
          role: "user",
          content: `Translate into ${language}:\n\n${englishReading}`
        }
      ];

      finalResult = await completeChat(
        translateMessages,
        "grok-4-1-fast-non-reasoning",
        0
      );
    }

    // =========================
    // DONE
    // =========================
    console.log(`✅ TAROT DONE in ${Date.now() - requestStart}ms`);

    return res.status(200).json({
      success: true,
      result: finalResult
    });

  } catch (err) {
    console.error("❌ TAROT ERROR:", err);
    return res.status(500).json({
      success: false,
      result: err.message || "Tarot service failed"
    });
  }
}
