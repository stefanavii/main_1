// server.js
// Backend server for the Agent Vacancy application form.
// Saves submissions (full name, email, phone, NIC number) into a real MySQL database.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2/promise");

const PORT = process.env.PORT || 3000;
const SITE_ID = process.env.SITE_ID || "1011"; // Default = Main site. Each copy sets its own value in Railway.

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "agent_vacancy_db",
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let pool; // MySQL connection pool

// ---------- Database setup ----------
async function initDb() {
  // First connect WITHOUT specifying a database, so we can create it if it doesn't exist yet
  const rootConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });

  await rootConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4`
  );
  await rootConn.end();

  // Now create a connection pool pointed at that database
  pool = mysql.createPool(DB_CONFIG);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applicants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      nic_number VARCHAR(20) NOT NULL,
      source_id VARCHAR(10) NOT NULL DEFAULT '1011',
      submitted_at DATETIME NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      nic_number VARCHAR(20) NOT NULL,
      course_path VARCHAR(50) NOT NULL DEFAULT 'AI Path',
      source_id VARCHAR(10) NOT NULL DEFAULT '1011',
      submitted_at DATETIME NOT NULL
    )
  `);

  // If these tables already existed from before (without source_id/course_path), add the columns safely.
  // This lets the upgrade apply to your already-running live database without losing data.
  await addColumnIfMissing("applicants", "source_id", "VARCHAR(10) NOT NULL DEFAULT '1011'");
  await addColumnIfMissing("enrollments", "source_id", "VARCHAR(10) NOT NULL DEFAULT '1011'");
  await addColumnIfMissing("enrollments", "course_path", "VARCHAR(50) NOT NULL DEFAULT 'AI Path'");
}

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB_CONFIG.database, table, column]
  );
  if (rows[0].cnt === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Added missing column '${column}' to '${table}'.`);
  }
}

// ---------- Validation helpers ----------
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digitCount = (phone.match(/\d/g) || []).length;
  return digitCount >= 7 && /^[\d+\-\s()]+$/.test(phone);
}

function isValidNic(nic) {
  // Sri Lankan NIC formats: old (9 digits + V/X) or new (12 digits)
  return /^([0-9]{9}[vVxX]|[0-9]{12})$/.test(nic.trim());
}

// ---------- Routes ----------

// Submit a new application
app.post("/api/applicants", async (req, res) => {
  const { full_name, email, phone_number, nic_number } = req.body || {};

  const errors = [];

  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
    errors.push("Full name is required (minimum 2 characters).");
  }
  if (!email || !isValidEmail(email.trim())) {
    errors.push("A valid email address is required.");
  }
  if (!phone_number || !isValidPhone(phone_number.trim())) {
    errors.push("A valid phone number is required (at least 7 digits).");
  }
  if (!nic_number || !isValidNic(nic_number.trim())) {
    errors.push("A valid NIC number is required (e.g. 123456789V or 200012345678).");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    await pool.query(
      `INSERT INTO applicants (full_name, email, phone_number, nic_number, source_id, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), email.trim(), phone_number.trim(), nic_number.trim(), SITE_ID, new Date()]
    );

    res.status(201).json({ success: true, message: "Application submitted successfully." });
  } catch (err) {
    console.error("Database insert error:", err);
    res.status(500).json({ success: false, errors: ["Server error. Please try again later."] });
  }
});

// View all applicants (simple admin/listing endpoint)
// In a real deployment, this should be protected with authentication.
app.get("/api/applicants", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone_number, nic_number, source_id, submitted_at FROM applicants ORDER BY id DESC"
    );
    res.json({ success: true, count: rows.length, applicants: rows });
  } catch (err) {
    console.error("Database read error:", err);
    res.status(500).json({ success: false, errors: ["Server error. Please try again later."] });
  }
});

// Submit a new AI course enrollment
app.post("/api/enrollments", async (req, res) => {
  const { full_name, email, phone_number, nic_number, course_path } = req.body || {};

  const VALID_PATHS = ["AI Path", "Youth Path", "Creator Path", "Marketing Path"];

  const errors = [];

  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
    errors.push("Full name is required (minimum 2 characters).");
  }
  if (!email || !isValidEmail(email.trim())) {
    errors.push("A valid email address is required.");
  }
  if (!phone_number || !isValidPhone(phone_number.trim())) {
    errors.push("A valid phone number is required (at least 7 digits).");
  }
  if (!nic_number || !isValidNic(nic_number.trim())) {
    errors.push("A valid NIC number is required (e.g. 123456789V or 200012345678).");
  }
  if (!course_path || !VALID_PATHS.includes(course_path)) {
    errors.push("Please select one course path.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    await pool.query(
      `INSERT INTO enrollments (full_name, email, phone_number, nic_number, course_path, source_id, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), email.trim(), phone_number.trim(), nic_number.trim(), course_path, SITE_ID, new Date()]
    );

    res.status(201).json({ success: true, message: "Enrollment submitted successfully." });
  } catch (err) {
    console.error("Database insert error:", err);
    res.status(500).json({ success: false, errors: ["Server error. Please try again later."] });
  }
});

// View all enrollments (simple admin/listing endpoint)
app.get("/api/enrollments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone_number, nic_number, course_path, source_id, submitted_at FROM enrollments ORDER BY id DESC"
    );
    res.json({ success: true, count: rows.length, enrollments: rows });
  } catch (err) {
    console.error("Database read error:", err);
    res.status(500).json({ success: false, errors: ["Server error. Please try again later."] });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- Start server ----------
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Connected to MySQL database: ${DB_CONFIG.database}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    console.error("Check your .env file — is MySQL running, and is the password correct?");
    process.exit(1);
  });
