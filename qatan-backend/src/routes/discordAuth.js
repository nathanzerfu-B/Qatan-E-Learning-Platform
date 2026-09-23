// src/routes/discordAuth.js
import express from "express";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { addInstructorToServer, createCourseChannel } from "../discordBot.js";

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();


// ✅ Redirect to Discord OAuth2 login (for instructor signup)
router.get("/login", (req, res) => {
  const { email } = req.query;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds.join&state=${email}`;
  res.redirect(oauthUrl);
});

// ✅ New endpoint: Redirect user to Discord OAuth2 join flow (for all roles)
router.get("/join", (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).send("Email query parameter is required");
  }
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20guilds.join&state=${email}`;
  res.redirect(oauthUrl);
});


// ✅ Optional: Link Discord to existing account (for instructors)
router.get("/link", (req, res) => {
  const email = req.query.email;
  const redirectUri = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join&state=${email}`;
  res.redirect(redirectUri);
});


const { addUserToServer } = await import("../discordBot.js");
// ✅ Discord OAuth2 callback (common for both login & link)
router.get("/callback", async (req, res) => {
console.log("👉 Discord OAuth callback triggered", req.query);
  const { code, state } = req.query;
  
  try {
    // 1️⃣ Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    // 2️⃣ Fetch Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userResponse.json();

    // 3️⃣ Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email: state } });
    if (!existingUser) {
      console.error(`❌ User not found for Discord link: ${state}`);
      return res.status(400).send("User not found. Please complete registration first.");
    }

    // 4️⃣ Add user to Discord server + assign role based on platform role
   await addUserToServer(discordUser.id, tokenData.access_token, existingUser.role);

    // 5️⃣ Update user with Discord info
    const updatedUser = await prisma.user.update({
      where: { email: state },
      data: {
        discordId: discordUser.id,
        status: "active",
      },
    });


    console.log(`✅ Linked Discord for ${updatedUser.email}`);

    // 6️⃣ Send friendly confirmation page
    res.send(`
      <html>
        <body style="font-family:sans-serif; text-align:center; margin-top:50px;">
          <h2>✅ Welcome ${discordUser.username}!</h2>
          <p>You’ve been added to the Qatan Discord Hub.</p>
          <br />
          <a href="${process.env.FRONTEND_URL}/login"
             style="display:inline-block; margin-top:20px; padding:10px 20px; background:#4a90e2; color:white; text-decoration:none; border-radius:8px;">
             Continue to Qatan
          </a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Discord OAuth error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
