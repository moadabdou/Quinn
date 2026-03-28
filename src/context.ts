import {
    ChatInputCommandInteraction,
    Message,
    User,
    GuildMember,
    Guild,
    TextBasedChannel,
    Client,
    Attachment,
    MessageFlags
} from "discord.js";

/**
 * A universal wrapper for Discord.js Message and ChatInputCommandInteraction objects.
 * This class abstracts the differences between slash commands and prefix commands,
 * allowing developers to write unified execution logic.
 */
export class Context {
    /** Indicates whether this context originated from a slash command interaction. */
    public isInteraction: boolean;
    /** The raw interaction object, defined only if isInteraction is true. */
    public interaction?: ChatInputCommandInteraction;
    /** The raw message object, defined only if isInteraction is false. */
    public message?: Message;
    /** Array of string arguments provided by the user (applicable mainly to prefix commands). */
    public args: string[];

    private replyMsg?: Message;
    private deferred = false;
    private replied = false;

    /**
     * Constructs a new Context instance.
     * @param ctx The originating Message or ChatInputCommandInteraction.
     * @param args Optional parsed arguments from the command string.
     */
    constructor(
        ctx: ChatInputCommandInteraction | Message,
        args: string[] = []
    ) {
        this.isInteraction = "isChatInputCommand" in ctx;

        if (this.isInteraction) {
            this.interaction = ctx as ChatInputCommandInteraction;
        } else {
            this.message = ctx as Message;
        }

        this.args = args;
    }

    /** Gets the user who invoked the command. */
    get author(): User {
        return this.isInteraction
            ? this.interaction!.user
            : this.message!.author;
    }

    /** Gets the guild member who invoked the command, if applicable. */
    get member(): GuildMember | null {
        return (
            this.isInteraction ? this.interaction!.member : this.message!.member
        ) as GuildMember | null;
    }

    /** Gets the guild (server) where the command was executed. */
    get guild(): Guild | null {
        return this.isInteraction
            ? this.interaction!.guild
            : this.message!.guild;
    }

    /** Gets the text channel where the command was executed. */
    get channel(): TextBasedChannel | null {
        return this.isInteraction
            ? this.interaction!.channel
            : this.message!.channel;
    }

    /** Gets the Discord bot client instance. */
    get client(): Client {
        return this.isInteraction
            ? this.interaction!.client
            : this.message!.client;
    }

    /** Gets the Unix timestamp of when the command was issued. */
    get createdTimestamp(): number {
        return this.isInteraction
            ? this.interaction!.createdTimestamp
            : this.message!.createdTimestamp;
    }

    private preparePayload(content: any, ephemeral: boolean) {
        const payload =
            typeof content === "string" ? { content } : { ...content };

        if (ephemeral) payload.flags = MessageFlags.Ephemeral;
        delete payload.ephemeral;

        return payload;
    }

    private async ensureDeferred(ephemeral = false) {
        if (!this.isInteraction || this.deferred || this.replied) return;

        const deferOptions: any = ephemeral
            ? { flags: MessageFlags.Ephemeral }
            : {};
        await this.interaction!.deferReply(deferOptions);
        this.deferred = true;
    }

    /**
     * Sends a reply to the user. Abstraction automatically handles Interaction vs Message differences,
     * including automatic deferred interaction resolution and ephemeral flagging.
     * @param content The string or message payload to send.
     * @param options Object containing an ephemeral flag.
     * @returns A promise resolving to the sent Message object.
     */
    async reply(
        content: any,
        options?: { ephemeral?: boolean }
    ): Promise<Message> {
        if (this.isInteraction) {
            const isEphemeral =
                options?.ephemeral ?? content?.ephemeral ?? false;

            await this.ensureDeferred(isEphemeral);
            const payload = this.preparePayload(content, isEphemeral);

            if (!this.replied) {
                const msg = await this.interaction!.editReply(payload);
                this.replied = true;
                return msg as Message;
            }
            return (await this.interaction!.followUp(payload)) as Message;
        }

        const sent = await this.message!.reply(
            this.preparePayload(content, false)
        );
        this.replyMsg = sent;
        this.replied = true;
        return sent;
    }

    /**
     * Edits the initial reply sent by the `reply` method.
     * @param content The new string or message payload.
     * @returns A promise resolving to the edited Message object.
     * @throws {Error} If attempting to edit before sending an initial reply.
     */
    async editReply(content: any): Promise<Message> {
        if (this.isInteraction) {
            if (!this.deferred && !this.replied)
                throw new Error("Cannot edit before reply/defer!");

            const payload = this.preparePayload(content, false);
            delete payload.flags;

            return (await this.interaction!.editReply(payload)) as Message;
        }

        if (!this.replyMsg) throw new Error("You must reply() first!");
        return await this.replyMsg.edit(this.preparePayload(content, false));
    }

    /**
     * Safely attempts to retrieve an attachment provided by the user.
     * For interactions, it checks the provided optionName.
     * For messages, it checks direct attachments, or the attachments in the replied-to message.
     * @param optionName The name of the attachment option (relevant for slash commands). Defaults to "image".
     * @returns A promise resolving to the Attachment object, or null if none is found.
     */
    async getAttachment(
        optionName: string = "image"
    ): Promise<Attachment | null> {
        if (this.isInteraction) {
            return this.interaction!.options.getAttachment(optionName) || null;
        } else {
            const msg = this.message!;

            if (msg.attachments.size > 0) {
                return msg.attachments.first() || null;
            }

            if (msg.reference?.messageId) {
                try {
                    const ref = await msg.channel.messages.fetch(
                        msg.reference.messageId
                    );
                    return ref.attachments.first() || null;
                } catch {
                    return null;
                }
            }

            return null;
        }
    }
}
