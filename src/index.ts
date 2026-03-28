import { GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { ExtendedClient } from "./client";
import { loadCommands } from "./handlers/commands";
import { loadEvents } from "./handlers/events";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
    logger.error("Missing DISCORD_TOKEN in .env file");
    process.exit(1);
}

// Initialize the Discord client with required intents
const client = new ExtendedClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load commands and events
loadCommands(client);
loadEvents(client);

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
