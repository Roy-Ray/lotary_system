const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 25060, // 25060 is Aiven's default port
  ssl: {
    rejectUnauthorized: true // REQUIRED for Aiven Cloud databases
  }
});

db.connect(err => {
  if (err) console.log("❌ DB Error:", err);
  else console.log("✅ MySQL Connected (Cloud)");
});

module.exports = db;