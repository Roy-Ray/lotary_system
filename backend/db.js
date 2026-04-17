const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // change if needed
  password: "NewStrong@123",        // your MySQL password
  database: "lottery_db"
});

db.connect(err => {
  if (err) console.log("❌ DB Error:", err);
  else console.log("✅ MySQL Connected (Local)");
});

module.exports = db;