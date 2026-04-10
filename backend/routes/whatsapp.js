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
  const { Body: messageBody, From: fromNumber, To: toNumber, Latitude, Longitude, NumMedia, MediaContentType0 } = req.body;

  // 1. Media Checking (Block Voice Notes, Calls, Images)
  const mediaCount = parseInt(NumMedia || "0");
  if (mediaCount > 0 && MediaContentType0) {
    if (MediaContentType0.startsWith('audio') || MediaContentType0.startsWith('video') || MediaContentType0.startsWith('image')) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("❌ PulseGrid Error: We cannot process voice notes, calls, or media. Please send TEXT or your LIVE LOCATION.");
      res.type('text/xml');
      return res.status(200).send(twiml.toString());
    }
  }

  // 2. Location Handling
  let processingText = messageBody;
  let hasLocation = false;
  if (Latitude && Longitude) {
    processingText = `[LIVE LOCATION PROVIDED] Latitude: ${Latitude}, Longitude: ${Longitude}`;
    hasLocation = true;
  }

  // Validation
  if (!processingText) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Please send text or your live location describing the emergency.");
    res.type('text/xml');
    return res.status(200).send(twiml.toString());
  }

  // 3. Fast Loading Response (< 3 seconds)
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message("⏳ PulseGrid AI is analyzing your emergency details. Please standby...");
  res.type('text/xml');
  res.status(200).send(twiml.toString()); // Close request immediately

  // 4. Asynchronous AI & Dispatch Processing
  (async () => {
    // Session Management
    if (!sessions.has(fromNumber)) {
      sessions.set(fromNumber, []);
    }
    const history = sessions.get(fromNumber);

    console.log(`[WhatsApp] New message from ${fromNumber}: "${processingText}"`);

    try {
      // AI Engine Call
      const triageResult = await aiService.triageMessage(processingText, history);

      history.push({ role: 'user', text: processingText });
      history.push({ role: 'model', text: JSON.stringify(triageResult) });
      if (history.length > 10) history.shift();

      console.log(`[Triage] Result for ${fromNumber}: ${triageResult.triage_tier}`);

      // Dashboard Alert Logic
      if (triageResult.triage_tier === 'RED' || triageResult.triage_tier === 'YELLOW') {
        notifyFrontend(req, triageResult, fromNumber, hasLocation, Latitude, Longitude, toNumber);
      }

      // Build Final Response
      let responseText = "";
      if (triageResult.status === "INVESTIGATING") {
        responseText = triageResult.follow_up_question || "Can you provide more details?";
      } else {
        responseText = `*PulseGrid Triage: ${triageResult.triage_tier}*\n\n`;
        const instructions = triageResult.citizen_instructions || [];
        const steps = instructions.map((step, i) => `${i + 1}. ${step}`).join('\n');
        
        if (steps) {
          responseText += `*Emergency Steps:*\n${steps}\n\n`;
        }

        if (triageResult.triage_tier === 'GREEN') {
          responseText += "No immediate hospital referral needed. Monitor symptoms.";
        } else {
          responseText += "🚨 *We are matching your case with nearby trauma teams.* Stay calm and keep your phone nearby.";
        }
      }

      // Send Asynchronous Payload via REST API
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: responseText,
        from: toNumber, // Automatically extract Twilio Sandbox Sender Number dynamically
        to: fromNumber
      });

    } catch (error) {
      console.error("Critical Triage Error:", error);
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: "PulseGrid Error: Triage Engine timed out. If this is a life-threatening emergency, proceed to the nearest hospital immediately.",
        from: toNumber,
        to: fromNumber
      }).catch(e => console.error("Fallback error:", e));
    }
  })();
});

/**
 * Placeholder for Dashboard sync.
 * Link this to your Socket.io instance for the real-time PulseGrid Map.
 */
function notifyFrontend(req, data, sender, hasLocation, lat, lng, toNumber) {
  console.log(`[ALERT] High-priority ${data.triage_tier} case for ${sender}`);
  console.log(`[BRIEF] ${data.brief}`);

  let actualLocation = [6.5925 + (Math.random() - 0.5) * 0.01, 3.3275 + (Math.random() - 0.5) * 0.01];
  let actualAddress = "Incoming Location Ping...";
  if (hasLocation && lat && lng) {
    actualLocation = [parseFloat(lat), parseFloat(lng)];
    actualAddress = "Exact GPS Location Received";
  }

  const alertData = {
    id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
    time: new Date().toISOString(),
    status: data.triage_tier.toLowerCase(),
    summary: data.brief || data.medical_intelligence,
    transcript: `WhatsApp Alert from ${sender}\nPulseGrid AI requested GPS location.`,
    instructions: data.citizen_instructions ? data.citizen_instructions.map((step, i) => `${i + 1}. ${step}`).join('\n') : "Awaiting further details.",
    location: actualLocation,
    address: actualAddress,
    patient_phone: sender, // Store the phone number for text-back dispatch
    sandbox_number: toNumber || "whatsapp:+14155238886" // Save exactly which sandbox number they used
  };

  // Persist it in memory so it doesn't disappear on frontend refresh
  if (req.app.locals.hospitalState) {
    // Add to the top of the queue
    req.app.locals.hospitalState.activeAlerts.unshift(alertData);
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('new_alert', alertData);
  }
}

module.exports = router;