const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const aiService = require('../services/aiService');

// In-memory session store (Hackathon-ready)
const sessions = new Map();

/**
 * PulseGrid Triage & Readiness Webhook
 * Path: POST /api/whatsapp (Matches your Twilio Console)
 */
router.post('/', async (req, res) => {
  const { Body: messageBody, From: fromNumber } = req.body;

  // 1. Validation
  if (!messageBody) {
    console.log("Empty message received from Twilio.");
    return res.status(400).send("Empty message body.");
  }

  // 2. Session Management
  if (!sessions.has(fromNumber)) {
    sessions.set(fromNumber, []);
  }
  const history = sessions.get(fromNumber);

  console.log(`[WhatsApp] New message from ${fromNumber}: "${messageBody}"`);

  try {
    // 3. AI Triage Engine Call
    // This sends the text to your aiService.js (Gemini 1.5 Flash)
    const triageResult = await aiService.triageMessage(messageBody, history);

    // 4. Update session history for "Context-Aware" conversation
    history.push({ role: 'user', text: messageBody });
    history.push({ role: 'model', text: JSON.stringify(triageResult) });

    // Keep history lean
    if (history.length > 10) history.shift();

    console.log(`[Triage] Result for ${fromNumber}: ${triageResult.triage_tier}`);

    // 5. Dashboard Alert Logic
    // If the case is urgent (RED/YELLOW), we fire the notification
    if (triageResult.triage_tier === 'RED' || triageResult.triage_tier === 'YELLOW') {
      notifyFrontend(triageResult, fromNumber);
    }

    // 6. Build the WhatsApp Response
    let responseText = "";
    
    if (triageResult.status === "INVESTIGATING") {
      // AI needs more info (e.g., "Are they breathing?")
      responseText = triageResult.follow_up_question;
    } else {
      // Finalized triage logic
      responseText = `*PulseGrid Triage: ${triageResult.triage_tier}*\n\n`;
      
      // Map the instructions array into a readable list
      const steps = triageResult.citizen_instructions.map((step, i) => `${i + 1}. ${step}`).join('\n');
      responseText += `*Emergency Steps:*\n${steps}\n\n`;
      
      if (triageResult.triage_tier === 'GREEN') {
        responseText += "No immediate hospital referral needed. Monitor symptoms.";
      } else {
        responseText += "🚨 *A trauma team is being alerted.* Stay calm and remain where you are.";
      }
    }

    // 7. Send TwiML back to Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(responseText);

    res.type('text/xml');
    res.status(200).send(twiml.toString());

  } catch (error) {
    console.error("Critical Triage Error:", error);
    
    // Safety fallback
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("PulseGrid Error: Triage Engine timed out. If this is a life-threatening emergency, please proceed to the nearest hospital immediately.");
    
    res.type('text/xml');
    res.status(500).send(twiml.toString());
  }
});

/**
 * Placeholder for Dashboard sync.
 * Link this to your Socket.io instance for the real-time PulseGrid Map.
 */
function notifyFrontend(data, sender) {
  console.log(`[ALERT] High-priority ${data.triage_tier} case for ${sender}`);
  console.log(`[BRIEF] ${data.brief}`);
}

module.exports = router;