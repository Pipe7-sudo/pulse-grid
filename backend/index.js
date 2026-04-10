const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
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

// Socket Room Management — each hospital dashboard joins their own room
io.on('connection', (socket) => {
  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital:${hospitalId}`);
    console.log(`[Socket] Hospital ${hospitalId} joined dashboard room`);
  });
});

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
  activeAlerts: [],
  resolvedCases: {} // keyed by hospitalId
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
  const { action, hospitalId } = req.body;

  const alertIndex = app.locals.hospitalState.activeAlerts.findIndex(a => a.id === id);
  if (alertIndex === -1) {
    return res.status(404).json({ success: false, error: 'Alert not found or already handled by another facility.' });
  }

  const matchedAlert = app.locals.hospitalState.activeAlerts[alertIndex];
  app.locals.hospitalState.activeAlerts.splice(alertIndex, 1);

  // Save to this hospital's resolved cases
  if (hospitalId) {
    if (!app.locals.hospitalState.resolvedCases[hospitalId]) {
      app.locals.hospitalState.resolvedCases[hospitalId] = [];
    }
    app.locals.hospitalState.resolvedCases[hospitalId].unshift({
      ...matchedAlert,
      resolvedAt: new Date().toISOString(),
      action,
      resolvedBy: hospitalId
    });
  }

  // Remove from ALL hospital dashboards
  io.emit('dispatch_action', { id, action });

  // Send contextual WhatsApp reply to patient
  if (matchedAlert.patient_phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const respondingHospital = hospitals.find(h => h.id === hospitalId);
      const hospitalName = respondingHospital?.name || 'LASUTH Emergency';

      let whatsappMsg;
      if (action === 'dispatch') {
        whatsappMsg = `� *HELP IS ON THE WAY!*\n\n*${hospitalName}* has dispatched an ambulance to your location.\n\nStay calm and remain where you are. Keep your phone accessible — our team is en route. 🙏`;
      } else if (action === 'invite') {
        whatsappMsg = `🏥 *A HOSPITAL IS READY TO RECEIVE YOU*\n\n*${hospitalName}* has a team prepared for your arrival.\n\n📍 *Area:* ${respondingHospital?.lga || ''}, Lagos\n📞 *Contact:* ${respondingHospital?.phone || 'N/A'}\n\nPlease proceed to the hospital immediately. Show this message at reception.`;
      } else {
        whatsappMsg = `Update: Your case has been reviewed by ${hospitalName}.`;
      }

      await client.messages.create({
        body: whatsappMsg,
        from: matchedAlert.sandbox_number || 'whatsapp:+14155238886',
        to: matchedAlert.patient_phone
      });
      console.log(`[Dispatch] ${action} WhatsApp sent to ${matchedAlert.patient_phone}`);
    } catch (error) {
      console.error('WhatsApp dispatch notification failed:', error.message);
    }
  }

  res.json({ success: true, id, action });
});

// Get resolved cases for a specific hospital
app.get('/api/hospital/resolved/:hospitalId', (req, res) => {
  const { hospitalId } = req.params;
  const cases = app.locals.hospitalState.resolvedCases[hospitalId] || [];
  res.json(cases);
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