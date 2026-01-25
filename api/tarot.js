// =========================
// HELPER: FORCE FULL RESPONSE
// =========================
async function completeChat(messages, model, temperature = 0.6) {
  let fullText = "";
  let rounds = 0;

  while (rounds < 6) {
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
        max_tokens: 800,
        messages
      })
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const chunk = data?.choices?.[0]?.message?.content || "";

    if (!chunk) break;

    fullText += chunk;

    // ✅ Stop if response looks finished
    if (
      chunk.trim().endsWith(".") ||
      chunk.trim().endsWith("!") ||
      chunk.trim().endsWith("?") ||
      chunk.trim().endsWith("။")
    ) {
      break;
    }

    // 🔁 Ask model to continue cleanly
    messages.push({ role: "assistant", content: chunk });
    messages.push({
      role: "user",
      content: "Continue from exactly where you stopped. Do NOT repeat. Finish all remaining sections."
    });
  }

  return fullText.trim();
}

// =========================
// MAIN TAROT HANDLER
// =========================
export default async function tarotHandler(req, res) {
  const startTime = Date.now();

  const { name, dob, sex, category, customQuestion, cards, language } = req.body || {};

  // =========================
  // VALIDATION
// =========================
  if (!name || !dob || !sex || !category || !Array.isArray(cards) || !language) {
    return res.status(400).json({
      success: false,
      result: "Missing required fields"
    });
  }

  if (!process.env.XAI_API_KEY) {
    return res.status(500).json({
      success: false,
      result: "API key missing"
    });
  }

  try {
    // =========================
    // STEP 1 — TAROT (ENGLISH)
    // =========================
    const tarotMessages = [
      {
        role: "system",
        content: `
You are a modern Tarot Master and intuitive life & business reader.

Write a FULL, detailed tarot reading in ENGLISH ONLY.
Use emojis to clearly separate sections.
Use headings and bullet points where helpful.
Speak directly to the person by name.
Be practical, motivational, and specific.

You MUST include ALL sections below, in order:

🌊 Person Vibe — based on birth energy and personality  
🃏 Drawn Card(s) — meaning and symbolism  
💼 Business / Life Energy — what this period is about  
💰 Money Flow — how money comes or blocks  
⚠ Biggest Risk — warning or shadow  
⭐ Lucky Areas — where success is strong  
📆 Timeline Feel — early / mid / late period  
💬 Final Message — direct advice

Do NOT summarize.
Do NOT rush.
Finish every section fully.
End naturally only when the reading is complete.
        `.trim()
      },
      {
        role: "user",
        content: `
Name: ${name}
DOB: ${dob}
Sex: ${sex}
Category: ${category}
Question: ${customQuestion || "None"}
Cards: ${cards.join(", ")}
        `.trim()
      }
    ];

    const englishReading = await completeChat(
      tarotMessages,
      "grok-4-1-fast-non-reasoning",
      0.7
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
          content: `
Translate the following text COMPLETELY.
Preserve emojis, headings, paragraphs, tone, and meaning.
Do NOT summarize.
Do NOT shorten.
          `.trim()
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
    console.log(`✅ TAROT DONE in ${Date.now() - startTime}ms`);

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
