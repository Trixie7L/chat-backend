const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const usersFile = "users.json";
const messagesFile = "messages.json";

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function readMessages() {
  if (!fs.existsSync(messagesFile)) return [];
  return JSON.parse(fs.readFileSync(messagesFile));
}

function writeMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }
  users.push({ username, password });
  writeUsers(users);
  res.json({ message: "Registered successfully" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.get("/api/conversations", (req, res) => {
  const { user } = req.query;
  const messages = readMessages();
  const conversations = new Set();
  messages.forEach(msg => {
    if (msg.from === user) conversations.add(msg.to);
    if (msg.to === user) conversations.add(msg.from);
  });
  res.json([...conversations]);
});

app.get("/api/messages", (req, res) => {
  const { user1, user2 } = req.query;
  const messages = readMessages();
  const conv = messages.filter(
    m =>
      (m.from === user1 && m.to === user2) ||
      (m.from === user2 && m.to === user1)
  );

  // Mark messages as read
  let updated = false;
  conv.forEach(m => {
    if (m.to === user1 && !m.read) {
      m.read = true;
      updated = true;
    }
  });
  if (updated) writeMessages(messages);

  res.json(conv);
});

app.post("/api/send", (req, res) => {
  const { from, to, text } = req.body;
  const messages = readMessages();
  const timestamp = new Date().toISOString();
  messages.push({ from, to, text, timestamp, read: false });
  writeMessages(messages);
  res.json({ message: "Message sent" });
});

app.get("/api/unread", (req, res) => {
  const { user } = req.query;
  const messages = readMessages();
  const unread = messages.filter(m => m.to === user && !m.read);
  res.json(unread);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
