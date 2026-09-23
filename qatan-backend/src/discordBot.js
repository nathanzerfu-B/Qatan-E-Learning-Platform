// src/discordBot.js
import { Client, GatewayIntentBits, PermissionsBitField } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// Discord bot ready
client.once("ready", () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

/**
 * Add instructor to the Discord Hub
 */
export const addInstructorToServer = async (discordId, oauthToken = null) => {
  // Deprecated in favor of addUserToServer with role param
  return await addUserToServer(discordId, oauthToken, "instructor");
};

/**
 * Add user to the Discord Hub with role assignment based on platform role
 */
export const addUserToServer = async (discordId, oauthToken = null, roleType = "student") => {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    let member = await guild.members.fetch(discordId).catch(() => null);

    // Join via OAuth2 if not in server
    if (!member && oauthToken) {
      member = await guild.members.add(discordId, {
        accessToken: oauthToken,
        roles: [],
      });
      console.log(`✅ Added ${discordId} via OAuth2`);
    }

    if (!member) {
      console.log(`⚠️ User ${discordId} is not yet in the server.`);
      return;
    }

    let roleIdEnvName = "";
    if (roleType === "instructor") {
      roleIdEnvName = "DISCORD_INSTRUCTOR_ROLE_ID";
    } else if (roleType === "student") {
      roleIdEnvName = "DISCORD_STUDENT_ROLE_ID";
    } else {
      console.warn(`⚠️ Unknown roleType '${roleType}', no roles assigned.`);
      return;
    }

    const roleId = process.env[roleIdEnvName];
    if (!roleId) {
      console.error(`❌ Discord role ID for ${roleType} not found in .env (${roleIdEnvName})`);
      return;
    }

    const role = guild.roles.cache.get(roleId);

    if (!role) {
      console.error(`❌ Discord role not found in guild for ID ${roleId}`);
      return;
    }

    await member.roles.add(role);
    console.log(`✅ Assigned ${roleType} role to ${member.user.username}`);
  } catch (error) {
    console.error(`❌ Error adding user to server with role ${roleType}:`, error);
  }
};

/**
 * Create a course-specific channel with automatic category management
 */
export const createCourseChannel = async (courseName, instructorDiscordId, instructorName) => {
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);

    // Verify the instructor is a member
    let instructorMember;
    try {
      instructorMember = await guild.members.fetch(instructorDiscordId);
    } catch {
      console.error(`Instructor ${instructorName} is not in the guild`);
      return null;
    }

    // Find all course categories
    let courseCategories = guild.channels.cache
      .filter(ch => ch.type === 4 && ch.name.toLowerCase().startsWith("📚 courses"))
      .sort((a, b) => a.name.localeCompare(b.name));

    let courseCategory = null;

    // Pick a category with <50 channels
    for (let cat of courseCategories.values()) {
      if (cat.children.cache.size < 50) {
        courseCategory = cat;
        break;
      }
    }

    // Create a new category if all are full
    if (!courseCategory) {
      const newCategoryNumber = courseCategories.size + 1;
      courseCategory = await guild.channels.create({
        name: `📚 Courses ${newCategoryNumber}`,
        type: 4, // Category
      });
      console.log(`🗂️ Created new category: ${courseCategory.name}`);
    }

    // Generate a safe, unique channel name
    let baseChannelName = courseName.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 80);

    // Avoid duplicate names by appending a number if needed
    let channelName = baseChannelName;
    let duplicateIndex = 1;
    while (courseCategory.children.cache.some(c => c.name === channelName)) {
      channelName = `${baseChannelName}-${duplicateIndex}`;
      duplicateIndex++;
    }

    // Create the channel
    const channel = await guild.channels.create({
      name: channelName,
      type: 0, // TEXT
      parent: courseCategory.id,
      topic: `Course created by ${instructorName}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: instructorDiscordId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.AttachFiles,
          ],
        },
      ],
    });

    console.log(`✅ Created course channel: ${channel.name} in ${courseCategory.name}`);
    return `https://discord.com/channels/${guild.id}/${channel.id}`;
  } catch (error) {
    console.error("❌ Error creating course channel:", error);
    return null;
  }
};

// Log in the Discord bot
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log("🤖 Discord bot logged in successfully"))
  .catch(console.error);
