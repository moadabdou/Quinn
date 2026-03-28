import { Message } from "discord.js";
import { ExtendedClient } from "../client";
import { BotEvent } from "../types";
import { executeWithValidation } from "../utils/validation";
import { Context } from "../context";

const event: BotEvent = {
    name: "messageCreate",
    execute: async (client: ExtendedClient, message: Message) => {
        if (message.author.bot) return;
        const prefix = process.env.PREFX || "$"; // example prefix
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        const command = client.commands.get(commandName);
        if (!command) return;

        const ctx = new Context(message, args);
        await executeWithValidation(client, command, ctx);
    }
};

export default event;
