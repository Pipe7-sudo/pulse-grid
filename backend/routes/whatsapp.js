const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const aiService = require('../services/aiService');
const { getNearestHospitals } = require('../data/hospitals');

// In-memory session store (Hackathon-ready)
const sessions = new Map();

/**
 * PulseGrid Triage & Readiness Webhook
 * Path: POST /api/whatsapp (Matches your Twilio Console)
 */
router.post('/', async (req, res) => {
  const { Body: messageBody, From: fromNumber, To: toNumber, Latitude, Longitude, NumMedia, MediaContentType0, MediaUrl0 } = req.body;

  // 1. Media Checking (Block Videos, Images)
  const mediaCount = parseInt(NumMedia || "0");
  const isAudio = mediaCount > 0 && MediaContentType0 && MediaContentType0.startsWith('audio');
  
  if (mediaCount > 0 && MediaContentType0 && !isAudio) {
    if (MediaContentType0.startsWith('video') || MediaContentType0.startsWith('image')) {
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("❌ PulseGrid Error: We cannot process video or images yet. Please send TEXT, VOICE NOTES, or your LIVE LOCATION.");
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
  if (!processingText && !isAudio) {
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Please send text, a voice note, or your live location describing the emergency.");
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
    // 4A. Perform Audio Transcription if Audio was sent
    if (isAudio && MediaUrl0) {
      console.log(`[WhatsApp] Downloading and transcribing Voice Note from ${fromNumber} via OpenRouter...`);
      try {
        const audioRes = await fetch(MediaUrl0);
        const arrayBuffer = await audioRes.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        
        processingText = await aiService.transcribeAudio(base64Audio, MediaContentType0);
        console.log(`[Transcription Success] "${processingText}"`);
      } catch (err) {
        console.error("Audio Transcription Error:", err);
        processingText = "[Audio transcription failed. Citizen sent an unintelligible voice note.]";
      }
    }

    // Session Management
    if (!sessions.has(fromNumber)) {
      sessions.set(fromNumber, []);
    }
    const history = sessions.get(fromNumber);

    console.log(`[WhatsApp] Processing text for ${fromNumber}: "${processingText}"`);

    try {
      // AI Engine Call
      const triageResult = await aiService.triageMessage(processingText, history);

      history.push({ role: 'user', text: processingText });
      history.push({ role: 'model', text: JSON.stringify(triageResult) });
      if (history.length > 10) history.shift();

      console.log(`[Triage] Result for ${fromNumber}: ${triageResult.triage_tier}`);



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

      // Dashboard Alert Logic — notify for ALL tiers so the dispatcher always sees activity
      if (triageResult.triage_tier === 'RED' || triageResult.triage_tier === 'YELLOW' || triageResult.triage_tier === 'GREEN') {
        notifyFrontend(req, triageResult, fromNumber, hasLocation, Latitude, Longitude, toNumber, history, responseText);
      }

      // Send Asynchronous reply back to patient via Twilio REST API
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: responseText,
          from: toNumber,
          to: fromNumber
        });
      } else {
        console.warn('[Twilio] Skipping reply — TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set in .env');
      }

    } catch (error) {
      console.error("Critical Triage Error:", error.message);
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: "PulseGrid Error: Triage Engine timed out. If this is a life-threatening emergency, proceed to the nearest hospital immediately.",
          from: toNumber,
          to: fromNumber
        }).catch(e => console.error("Fallback send error:", e.message));
      } else {
        console.warn('[Twilio] Skipping fallback reply — credentials not set in .env');
      }
    }
  })();
});

/**
 * Notify the frontend dashboard via Socket.IO when a new triage alert fires.
 */
function notifyFrontend(req, data, sender, hasLocation, lat, lng, toNumber, history, responseText) {
  console.log(`[ALERT] High-priority ${data.triage_tier} case for ${sender}`);
  console.log(`[BRIEF] ${data.brief}`);

  let actualLocation = [6.5925 + (Math.random() - 0.5) * 0.01, 3.3275 + (Math.random() - 0.5) * 0.01];
  let actualAddress = "Incoming Location Ping...";
  if (hasLocation && lat && lng) {
    actualLocation = [parseFloat(lat), parseFloat(lng)];
    actualAddress = "Exact GPS Location Received";
  }

  // Find 5 nearest hospitals to patient location
  const nearestHospitals = getNearestHospitals(actualLocation[0], actualLocation[1], 5);

  // Build transcript from history
  let fullTranscript = '';
  if (history && history.length > 0) {
    fullTranscript = history.filter(h => h.role === 'user').map(h => `${sender}: ${h.text}`).join('\n');
  } else {
    fullTranscript = `${sender}: WhatsApp Alert Received`;
  }
  if (responseText) {
    fullTranscript += `\nPulseGrid AI: ${responseText.replace(/\n+/g, ' ')}`;
  }

  const alertData = {
    id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
    time: new Date().toISOString(),
    status: data.triage_tier.toLowerCase(),
    summary: data.brief || data.medical_intelligence,
    transcript: fullTranscript,
    instructions: data.citizen_instructions ? data.citizen_instructions.map((step, i) => `${i + 1}. ${step}`).join('\n') : "Awaiting further details.",
    location: actualLocation,
    address: actualAddress,
    nearestHospitals,              // Array of top 5 closest hospitals
    patient_phone: sender,
    sandbox_number: toNumber || "whatsapp:+14155238886"
  };

  // Persist it in memory
  if (req.app.locals.hospitalState) {
    req.app.locals.hospitalState.activeAlerts.unshift(alertData);
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('new_alert', alertData);
  }
}

module.exports = router;
