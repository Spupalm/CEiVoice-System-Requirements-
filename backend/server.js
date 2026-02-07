import express from "express";
import { generateSupportTicket } from "./services/aiService.js";
// Simple Express server to handle AI ticket drafting requests
const app = express();
app.use(express.json());

app.post("/api/ai/draft-ticket", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const result = await generateSupportTicket(message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "AI failed" });
  }
});
// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

