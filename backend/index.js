const express = require('express');
const cors = require('cors');
require('dotenv').config();
const twilio = require('twilio');
const http = require('http');
const { Server } = require('socket.io');
const { hospitals, getNearestHospitals } = require('./data/hospitals');

const app = express();
const port = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

app.set('io', io);

// MIDDLEWARE
app.use(cors());
app.use(express.json()); // For React frontend JSON requests
app.use(express.urlencoded({ extended: false })); // CRITICAL: For Twilio WhatsApp data

// Basic health check
app.get('/', (req, res) => {
  res.send('PulseGrid Backend is running!');
});

// MOUNTING THE WHATSAPP ROUTE
const whatsappRouter = require('./routes/whatsapp');
app.use('/api/whatsapp', whatsappRouter);

// Hospital Registry Endpoints
app.get('/api/hospitals', (req, res) => {
  res.json(hospitals);
});

app.get('/api/hospitals/nearest', (req, res) => {
  const { lat, lng, count } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
  const nearest = getNearestHospitals(parseFloat(lat), parseFloat(lng), parseInt(count) || 5);
  res.json(nearest);
});

// Original SMS fallback route (Keep this as is)
app.post('/api/send-sms', async (req, res) => {
  const { to, message } = req.body;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'Twilio credentials not configured' });
  }

  const client = twilio(accountSid, authToken);

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    res.json({ success: true, sid: result.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global In-Memory State
app.locals.hospitalState = {
  isAccepting: true,
  activeAlerts: [
    {
      id: 'AL-1029',
      time: new Date(Date.now() - 2 * 60000 - 14000).toISOString(),
      status: 'red',
      summary: 'Severe chest pain, breathlessness, sweating',
      transcript: "PulseGrid AI: EMERGENCY HOTLINE. Please describe your emergency via text.\n+234 803 123 4567: My dad... he's clutching his chest. He can't breathe. He's sweating profusely. Please hurry!\nPulseGrid AI: Location received. Tracking exact GPS. Have dispatched an ambulance. Is he conscious?",
      instructions: "1. Keep patient calm and seated.\n2. Loosen tight clothing.\n3. If prescribed, assist with nitroglycerin.\n4. Prepare for CPR if patient becomes unresponsive.",
      location: [6.5925, 3.3275],
      address: "Mobolaji Bank Anthony Way, Ikeja, Lagos",
    },
    {
      id: 'AL-1030',
      time: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'yellow',
      summary: 'Fractured leg from fall, stable',
      transcript: "PulseGrid AI: EMERGENCY HOTLINE. How can we help?\n+234 812 987 6543: I fell off a ladder and I think my leg is broken. The bone looks weird but it's not bleeding much.\nPulseGrid AI: Stay still, do not try to move the leg. Medics from LASUTH are en route to your WhatsApp GPS location.",
      instructions: "1. Do not move the patient unless in immediate danger.\n2. Keep the injured limb straight and immobilized.\n3. Apply ice pack if available without applying pressure.",
      location: [6.5890, 3.3300],
      address: "Oba Akran Ave, Ikeja, Lagos",
    }
  ]
};

// Return the entire hospital state
app.get('/api/hospital/state', (req, res) => {
  res.json(app.locals.hospitalState);
});

// App state mock for the endpoints
app.put('/api/hospital/capacity', (req, res) => {
  const { isAccepting } = req.body;
  app.locals.hospitalState.isAccepting = isAccepting;
  io.emit('capacity_update', { isAccepting });
  res.json({ success: true, isAccepting });
});

app.post('/api/dispatch/:id', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  const alertIndex = app.locals.hospitalState.activeAlerts.findIndex(a => a.id === id);
  if (alertIndex !== -1) {
    const matchedAlert = app.locals.hospitalState.activeAlerts[alertIndex];
    // Remove from active queue
    app.locals.hospitalState.activeAlerts.splice(alertIndex, 1);

    // Announce to all frontends (so they remove it from their boards)
    io.emit('dispatch_action', { id, action });

    // If accepted, notify the patient via WhatsApp
    if (action === 'accept' && matchedAlert.patient_phone) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: `🚨 DISPATCH CONFIRMED 🚨\nLASUTH Emergency has accepted your case.\nMedical personnel are preparing for your arrival or dispatching an ambulance to your location. Stay calm.`,
            from: matchedAlert.sandbox_number || 'whatsapp:+14155238886', // Safely fallback if missing
            to: matchedAlert.patient_phone
          });
          console.log(`[Dispatch] WhatsApp confirmation sent to ${matchedAlert.patient_phone}`);
        } catch (error) {
          console.error("Failed to send WhatsApp dispatch notification:", error);
        }
      } else {
        console.warn("Twilio credentials missing. Notifying patient via WhatsApp failed.");
      }
    }

    res.json({ success: true, id, action });
  } else {
    // If someone else already accepted it
    res.status(404).json({ success: false, error: 'Alert not found or already handled by another facility.' });
  }
});

server.listen(port, () => {
  console.log(`🚀 PulseGrid Server is running on port: ${port}`);
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use by another process.`);
  } else {
    console.error(`❌ Server error: ${error.message}`);
  }
});