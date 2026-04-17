require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const db = require("./db");

const app = express();   // ✅ VERY IMPORTANT

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROUTES ================= */

const path = require("path");
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Get participants
app.get("/participants", (req, res) => {
  db.query("SELECT * FROM participants", (err, data) => {
    if (err) return res.send(err);
    res.json(data);
  });
});

// Top 10
app.get("/top10", (req, res) => {
  db.query(
    "SELECT * FROM participants ORDER BY score DESC LIMIT 10",
    (err, data) => {
      if (err) return res.send(err);
      res.json(data);
    }
  );
});

// Event
app.get("/event", (req, res) => {
  db.query("SELECT * FROM event LIMIT 1", (err, data) => {
    if (err) return res.send(err);
    res.json(data[0]);
  });
});

// Spin
app.post("/spin", (req, res) => {
  const { code } = req.body;

  if (code !== "1234") {
    return res.status(403).send("Unauthorized ❌");
  }

  db.query(
    "SELECT * FROM participants WHERE is_eligible = TRUE",
    (err, data) => {
      if (err) return res.send(err);

      if (data.length === 0) {
        return res.send("No eligible participants");
      }

      const winner = data[crypto.randomInt(0, data.length)];

      db.query(
        "INSERT INTO winners (participant_id) VALUES (?)",
        [winner.id]
      );

      res.json(winner);
    }
  );
});















/* ================= LIVE VISITOR COUNTER ROUTES ================= */

// 1. Increment count (New visitor)
app.get("/visit", (req, res) => {
  db.query("UPDATE page_views SET views = views + 1 WHERE id = 1", (err) => {
    if (err) return res.status(500).send(err);
    
    db.query("SELECT views FROM page_views WHERE id = 1", (err, data) => {
      if (err) return res.status(500).send(err);
      res.json({ views: data[0].views });
    });
  });
});

// 2. Just fetch current count (For live polling)
app.get("/visitors", (req, res) => {
  db.query("SELECT views FROM page_views WHERE id = 1", (err, data) => {
    if (err) return res.status(500).send(err);
    res.json({ views: data[0].views });
  });
});

/* ================= SERVER ================= */
const PORT = 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
