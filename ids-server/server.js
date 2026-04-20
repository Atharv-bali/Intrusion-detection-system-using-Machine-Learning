const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
}));

io.on('connection', (socket) => {
    console.log("Analysts connected to live stream");
});

app.use(express.json());

// 1. Connect to MongoDB (Local or Atlas)
mongoose.connect('mongodb://127.0.0.1:27017/wipro_ids')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 2. Define a Schema for Security Logs
const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  isAnomaly: Boolean,
  confidence: Number,
  type: String
});
const Log = mongoose.model('Log', LogSchema);

// 3. The Main IDS Endpoint
app.use('/api/user', authRoutes);
const verifyToken = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  const verified = jwt.verify(token, 'WIPRO_SECRET_KEY');
  if (!verified) return res.status(400).json({ message: 'Invalid Token' });
  req.user = verified;
  next();
};

app.post('/api/analyze', verifyToken, async (req, res) => {
  try {
    // Forward the features to your Flask AI Bridge
    const flaskResponse = await axios.post('http://127.0.0.1:5000/predict', {
      features: req.body.features
    });

    const { is_anomaly, confidence } = flaskResponse.data;

    // Save the incident to the database
    const newLog = new Log({
      isAnomaly: is_anomaly,
      confidence: confidence,
      type: is_anomaly ? "Malicious" : "Benign"
    });
    await newLog.save();
    io.emit('new-thread-data', newLog); // Emit the new log to all connected clients
    res.json(newLog);
  } catch (error) {
    res.status(500).json({ error: "AI Bridge unreachable" });
  }
});

// 4. Fetch History for the Chart
app.get('/api/logs', async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(10);
  res.json(logs);
});

server.listen(8080, () => console.log("MERN Server on port 8080"));