import fs from "fs";
import path from "path";
import { ExtendedClient } from "../client";
import { Command } from "../types";
import { logger } from "../utils/logger";

export function loadCommands(client: ExtendedClient) {
    const foldersPath = path.join(__dirname, "..", "commands");
    if (!fs.existsSync(foldersPath)) {
        logger.warn("No commands folder found.");
        return;
    }
    fs.readdirSync(foldersPath).forEach(folder => {
        const fullPath = path.join(foldersPath, folder);
        if (fs.statSync(fullPath).isDirectory()) {
            fs.readdirSync(fullPath)
                .filter(f => f.endsWith(".ts") || f.endsWith(".js"))
                .forEach(file => {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const cmd: Command = require(path.join(fullPath, file)).default;
                    if (!cmd || !cmd.name) {
                        logger.warn(`The command at ${file} is missing a required "name" or "execute" property.`);
                        return;
                    }
                    cmd.category = folder.toUpperCase();
                    client.commands.set(cmd.name, cmd);
                });
        }
    });
    logger.info(`Loaded ${client.commands.size} commands.`);
}
