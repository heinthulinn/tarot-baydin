export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { cards, question, language } = req.body;
  
    if (!cards || !question || !language) {
      return res.status(400).json({ error: "Missing fields" });
    }
  
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.XAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-2",
          messages: [
            {
              role: "system",
              content: "You are a professional tarot reader. Speak in a mystical and calm tone."
            },
            {
              role: "user",
              content: `
  Tarot cards: ${cards.join(", ")}
  Question: ${question}
  
  Respond ONLY in ${language}.
  Do not mention you are an AI.
  `
            }
          ]
        })
      });
  
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content;
  
      return res.status(200).json({
        success: true,
        result: aiText
      });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "AI request failed" });
    }
  }
  