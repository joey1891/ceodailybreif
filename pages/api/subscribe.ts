import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

// Configure the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;
    
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Check if email already exists
    const checkResult = await pool.query(
      "SELECT email FROM subscriber WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ message: "Email already subscribed" });
    }

    // Insert the new subscriber
    await pool.query(
      "INSERT INTO subscriber (email, created_at) VALUES ($1, NOW())",
      [email]
    );

    return res.status(200).json({ message: "Successfully subscribed" });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Failed to subscribe" });
  }
} 