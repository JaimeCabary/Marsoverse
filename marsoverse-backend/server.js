require('dotenv').config();
// Import tracing first to start telemetry before app code
require('./tracing');

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route example
app.get('/', (req, res) => {
  res.send('Marsoverse backend running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
