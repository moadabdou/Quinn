import { ApplicationCommandOptionType } from "discord.js";
import { Context } from "./context";

export interface CommandConfig {
    nsfwOnly?: boolean;
    ownerOnly?: boolean;
    modOnly?: boolean;
    allowedRoles?: string[];
    disallowedRoles?: string[];
    allowPrefix?: boolean;
    cooldown?: { time: number; limit: number };
    requireHierarchy?: boolean;
}

export interface Command {
    name: string;
    description: string;
    category?: string;
    options?: Array<{
        name: string;
        description: string;
        type: ApplicationCommandOptionType;
        required?: boolean;
    }>;
    conf?: CommandConfig;
    execute: (ctx: Context) => Promise<void>;
}
