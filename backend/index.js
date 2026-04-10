const express = require('express');
const cors = require('cors');
require('dotenv').config();
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json()); // For React frontend JSON requests
app.use(express.urlencoded({ extended: false })); // CRITICAL: For Twilio WhatsApp data

// Basic health check
app.get('/', (req, res) => {
  res.send('PulseGrid Backend is running!');
});

// MOUNTING THE WHATSAPP ROUTE
// This means any request to /api/whatsapp will be handled by whatsapp.js
const whatsappRouter = require('./routes/whatsapp');
app.use('/api/whatsapp', whatsappRouter);

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

const server = app.listen(port, () => {
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