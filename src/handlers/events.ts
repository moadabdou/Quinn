import fs from "fs";
import path from "path";
import { ExtendedClient } from "../client";
import { BotEvent } from "../types";
import { logger } from "../utils/logger";

export function loadEvents(client: ExtendedClient) {
    const eventsPath = path.join(__dirname, "..", "events");
    if (!fs.existsSync(eventsPath)) {
        logger.warn("No events folder found.");
        return;
    }
    
    let eventCount = 0;
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const event: BotEvent = require(filePath).default;
        
        if (!event || !event.name || !event.execute) {
            logger.warn(`The event at ${filePath} is missing required properties.`);
            continue;
        }

        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
        }
        eventCount++;
    }
    logger.info(`Loaded ${eventCount} events.`);
}
