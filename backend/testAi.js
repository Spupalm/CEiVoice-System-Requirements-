import { generateSupportTicket } from "./services/aiService.js";
// Simple test to verify AI ticket drafting
async function test() {
  try {
    const ticket = await generateSupportTicket(
      "My app crashes when uploading PDF"
    );

    console.log("AI RESPONSE:");
    console.log(JSON.stringify(ticket, null, 2));
  } catch (err) {
    console.error("AI ERROR:", err.message);
  }
}

test();
