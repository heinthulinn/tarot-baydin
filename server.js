import express from "express";
import cors from "cors";
import tarotHandler from "./api/tarot.js";

const app = express();

// 🔍 LOG EVERY REQUEST (IMPORTANT)
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ✅ CORS
app.use(cors());

// ✅ BODY PARSER (CRITICAL)
app.use(express.json({ limit: "1mb" }));

// ✅ HEALTH CHECK (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.status(200).send("Tarot API is alive 🔮");
});

// ✅ TAROT ENDPOINT
app.post("/tarot", tarotHandler);

// ❌ DO NOT hardcode 3000 on Railway
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Tarot API running on port ${PORT}`);
});
