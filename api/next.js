import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { Pool } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); 

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// The Registration Route
app.post('/api/submit', async (req, res) => {
  console.log("📥 New registration request...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL is missing.");
    return res.status(500).json({ error: "Server config error" });
  }

  try {
    const { name, email, phone, college, department, year, events, transactionId } = req.body;
    
    // --- THIS IS THE PART THAT SAVES TO YOUR NEON TABLE ---
    // Your table 'registrations' matches these columns perfectly!
    const query = `
      INSERT INTO registrations 
      (name, email, phone, college, department, year, events, transaction_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [name, email, phone, college, department, year, events, transactionId];
    
    await pool.query(query, values);
    // ------------------------------------------------------

    console.log("✅ Success! User saved to database.");
    return res.status(200).json({ message: "Registration successful!" });

  } catch (error) {
    console.error("❌ Database Error:", error);
    // This will print the exact reason if it fails (like "duplicate transaction ID")
    return res.status(500).json({ error: "Database error" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});