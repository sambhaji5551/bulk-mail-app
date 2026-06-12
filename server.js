const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path'); // Add path module
require('dotenv').config();

const app = express();

// Required to pass HTTP payloads safely between frontend and backend
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- SERVE STATIC FRONTEND FILES ---
// This tells Express to look inside a folder named 'public' for your index.html and static files
app.use(express.static(path.join(__dirname, 'public')));

// Main incoming request handler matching the frontend button click events
app.post('/send', async (req, res) => {
  console.log("🚀 Incoming Web Hook Match Triggered!");
  console.log("📥 Credentials and details received from Frontend UI:");
  console.log(req.body);

  const { host, port, secure, auth, from, to, subject, text, html } = req.body;

  if (!to) {
    return res.json({ code: "EmptyTargetList", accepted: [], rejected: [] });
  }

  const targetEmails = to.split(',').map(item => item.trim());

  const transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port),
    secure: secure,
    auth: {
      user: auth?.user,
      pass: auth?.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let accepted = [];
  let rejected = [];

  for (const email of targetEmails) {
    try {
      await transporter.sendMail({
        from: from || auth?.user,
        to: email,
        subject: subject || "Campaign Broadcast",
        text: text,
        html: html
      });
      console.log(`✅ Mail relayed successfully to: ${email}`);
      accepted.push(email);
    } catch (err) {
      console.error(`❌ Delivery failure for target ${email}:`, err.message);
      rejected.push(email);
    }
  }

  return res.json({
    code: null,
    accepted: accepted,
    rejected: rejected
  });
});

// Wildcard route to make sure React routing functions properly and serves index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`📡 SMTP Distribution Node running on port ${PORT}`));