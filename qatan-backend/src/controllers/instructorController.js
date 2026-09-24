import { PrismaClient } from "@prisma/client";
import cloudinary, { uploadToCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "../middleware/securityMiddleware.js";

const prisma = new PrismaClient();

// Update instructor profile
export const updateInstructorProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can update their profile" });
    }

    const { name, password, bio } = req.body;
    let profilePictureUrl = null;

    // Handle profile picture upload using your helper
    if (req.file) {
      try {
        profilePictureUrl = await uploadToCloudinary(req.file, "qatan/profiles");
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ success: false, message: "Failed to upload profile picture" });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;
    if (password) {
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profilePicture: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating instructor profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
