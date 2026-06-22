const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'strategy_db.json');

// Initial State
let defaultDb = {
  skillMetrics: [
    { subject: 'ASP.NET Core & C#', Laila: 95, Market: 95, fullMark: 100 },
    { subject: 'React.js & TS', Laila: 85, Market: 90, fullMark: 100 },
    { subject: 'Python (AI/Backend)', Laila: 85, Market: 88, fullMark: 100 },
    { subject: 'System Arch & APIs', Laila: 80, Market: 85, fullMark: 100 },
    { subject: 'DB Management', Laila: 75, Market: 80, fullMark: 100 },
    { subject: 'Cloud & CI/CD', Laila: 40, Market: 85, fullMark: 100 },
  ],
  actionItems: [
    { id: 1, type: 'critical', text: 'Skill Gap Detected: Master Docker & CI/CD. The market expects cloud readiness. Build a GitHub Actions pipeline today.', status: 'pending' },
    { id: 2, type: 'critical', text: 'Skill Gap Detected: Implement Message Brokers (RabbitMQ/Kafka) & Automated Testing (xUnit) in your backend projects.', status: 'pending' },
    { id: 3, type: 'warning', text: 'Resume Update: Add quantifiable scale metrics (e.g., "Handled 10,000 RPM") to your GASCO/MOI experience.', status: 'pending' },
    { id: 4, type: 'success', text: 'Highlight your production IoT experience aggressively in interviews. It puts you in the top 1% of students.', status: 'completed' }
  ]
};

// Load or Create DB
let db;
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
} else {
  db = defaultDb;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

const saveDb = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

app.get('/api/strategy/skills', (req, res) => res.json(db.skillMetrics));
app.get('/api/strategy/actions', (req, res) => res.json(db.actionItems));

app.post('/api/strategy/actions/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id);
  const action = db.actionItems.find(a => a.id === id);
  if (action) {
    action.status = action.status === 'completed' ? 'pending' : 'completed';
    saveDb();
    res.json(action);
  } else {
    res.status(404).json({ error: 'Action not found' });
  }
});

// AI Mock Interview Simulator Endpoint
const sessions = {}; // In-memory session tracking

app.post('/api/interview/chat', async (req, res) => {
  try {
    const { sessionId, jobTitle, company, history, message } = req.body;
    
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
    
    let chat = sessions[sessionId];
    if (!chat) {
      // Initialize a new chat session tailored to the job
      const systemInstruction = `You are a strict technical recruiter for ${company} interviewing a candidate for the "${jobTitle}" role.
The candidate is a Year 3 CS student named Laila with strong C#, ASP.NET, IoT, and React skills. 
However, she has known gaps in modern Cloud Deployment (Docker) and CI/CD (GitHub Actions).
Your job is to ask her difficult, targeted technical questions related to ${jobTitle}. 
Ask ONE question at a time. Do not give the answers away. If she answers poorly, correct her and dive deeper. Wait for her answer before proceeding.`;

      chat = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: { systemInstruction }
      });
      sessions[sessionId] = chat;
    }

    const response = await chat.sendMessage({ content: message });
    res.json({ reply: response.text });

  } catch (error) {
    console.error('Interview API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Career Partner API running on http://localhost:${PORT}`);
});
