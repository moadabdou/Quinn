import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env file");
  process.exit(1);
}

// Initialize the Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Ready event - fires when bot successfully connects
client.once("clientReady", (readyClient) => {
  console.log(`Quinn is online! Logged in as ${readyClient.user.tag}`);
  console.log(`Serving ${readyClient.guilds.cache.size} guild(s)`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
