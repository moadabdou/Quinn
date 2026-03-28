import { GuildMember, TextChannel, PermissionFlagsBits, Collection } from "discord.js";
import { Command } from "../types";
import { ExtendedClient } from "../client";
import { Context } from "../context";
import { logger } from "./logger";

/**
 * Validates a command execution request against its configured CommandConfig limitations.
 * 
 * @param client The ExtendedClient instance.
 * @param command The command object being requested.
 * @param ctx The originating message or interaction context.
 * @param userId The Discord ID of the user requesting execution.
 * @param member The GuildMember object of the requester, if available.
 * @param channel The TextChannel where the invocation occurred.
 * @param isOwner A boolean indicating if the requester is the bot owner.
 * @returns A string containing an error message if validation fails, or null if validation passes.
 */
export async function runValidation(
    client: ExtendedClient,
    command: Command,
    ctx: any,
    userId: string,
    member: GuildMember | null,
    channel: any,
    isOwner: boolean
): Promise<string | null> {
    const conf = { ...command.conf };

    if (conf.ownerOnly && !isOwner)
        return "This Command can only be used by the Bot Owner.";

    if (conf.nsfwOnly && !(channel as TextChannel).nsfw)
        return "🔞 This command can only be used in NSFW channels.";

    if (
        conf.modOnly &&
        member &&
        !member.permissions.has(PermissionFlagsBits.ManageGuild)
    )
        return "You do not have permission to use this command.";

    if (conf.allowedRoles && conf.allowedRoles.length > 0 && member) {
        const hasRole = member.roles.cache.some(r =>
            conf.allowedRoles!.includes(r.id)
        );
        if (!hasRole && !isOwner)
            return "You do not have the required role to use this.";
    }

    if (conf.requireHierarchy && member && "mentions" in ctx) {
        const target = ctx.mentions.members?.first();
        if (
            target &&
            target.roles.highest.position >= member.roles.highest.position &&
            !isOwner
        ) {
            return "You cannot modify a user with a higher/equal role.";
        }
    }

    if (!client.cooldowns.has(command.name))
        client.cooldowns.set(command.name, new Collection());

    const timestamps = client.cooldowns.get(command.name)!;
    const now = Date.now();
    const cooldownAmount = (conf.cooldown?.time || 3) * 1000;
    const maxUses = conf.cooldown?.limit || 1;

    const userTimestamps = timestamps.get(userId) || [];
    const validTimestamps = userTimestamps.filter(
        t => now < t + cooldownAmount
    );

    if (validTimestamps.length >= maxUses && !isOwner) {
        const waitTime = (
            (validTimestamps[0] + cooldownAmount - now) /
            1000
        ).toFixed(1);
        return `⏳ Wait ${waitTime}s before using this command again.`;
    }

    validTimestamps.push(now);
    timestamps.set(userId, validTimestamps);

    return null;
}

/**
 * Handles validation and execution seamlessly for any unified command.
 * @param client The bot's ExtendedClient instance.
 * @param command The unified Command object.
 * @param ctx The generated Context.
 */
export async function executeWithValidation(
    client: ExtendedClient,
    command: Command,
    ctx: Context
) {
    const isOwner = ctx.author.id === process.env.OWNER_ID;
    const rawCtx = ctx.isInteraction ? ctx.interaction : ctx.message;

    const error = await runValidation(
        client,
        command,
        rawCtx,
        ctx.author.id,
        ctx.member,
        ctx.channel,
        isOwner
    );

    if (error) {
        logger.warn(`User ${ctx.author.tag} (${ctx.author.id}) was blocked from running command '${command.name}': ${error}`);
        return ctx.reply({ content: error, ephemeral: true });
    }

    try {
        logger.info(`User ${ctx.author.tag} (${ctx.author.id}) is executing command: ${command.name}`);
        await command.execute(ctx);
        logger.info(`Successfully executed command: ${command.name} for ${ctx.author.tag}`);
    } catch (err) {
        logger.error(`Error executing command ${command.name} for ${ctx.author.tag}:`, err);
        ctx.reply({
            content: "There was an error running this command.",
            ephemeral: true
        });
    }
}
