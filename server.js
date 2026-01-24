import express from "express";
import cors from "cors";
import tarotHandler from "./api/tarot.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/tarot", tarotHandler);

// REQUIRED for Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tarot API running on port ${PORT}`);
});
