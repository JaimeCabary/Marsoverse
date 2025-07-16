const express = require('express');
const cors = require('cors');
const app = express();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
require('dotenv').config();

// 🟡 Honeycomb Tracing already setup in main telemetry
// 🔴 Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
app.use(cors());
app.use(express.json());

app.post('/log/player', async (req, res) => {
  const { name, age, gender, companion, cyborg, wallet, xp, level, mission, timestamp = Date.now() } = req.body;

  try {
    await db.ref('players').push({ name, age, gender, companion, cyborg, wallet, xp, level, mission, timestamp });
    res.status(200).json({ message: 'Logged to Honeycomb and Firebase' });
  } catch (err) {
    console.error('Firebase logging error:', err);
    res.status(500).json({ error: 'Failed to log' });
  }
});

module.exports = app;
