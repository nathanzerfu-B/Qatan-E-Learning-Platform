// controllers/adminSettings.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.platformSettings.findFirst();

    // Auto-create default settings if none exist
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          siteName: "Qatan E-Learning",
          defaultLanguage: "English",
          supportEmail: "support@example.com",
          chapaPublicKey: null,
          chapaSecretKey: null,
          chapaEnabled: false,
        },
      });
    }

    return res.json(settings);
  } catch (err) {
    console.error("❌ Failed to fetch settings:", err);
    return res.status(500).json({ message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req, res) => {
  const {
    siteName,
    defaultLanguage,
    supportEmail,
    chapaPublicKey,
    chapaSecretKey,
    chapaEnabled,
  } = req.body;

  try {
    let settings = await prisma.platformSettings.findFirst();

    // If no settings exist, create them
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          siteName,
          defaultLanguage,
          supportEmail,
          chapaPublicKey,
          chapaSecretKey,
          chapaEnabled,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          siteName,
          defaultLanguage,
          supportEmail,
          chapaPublicKey,
          chapaSecretKey,
          chapaEnabled,
        },
      });
    }

    return res.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (err) {
    console.error("❌ Failed to update settings:", err);
    return res.status(500).json({ message: "Failed to update settings" });
  }
};
