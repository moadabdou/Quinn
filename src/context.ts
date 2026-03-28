import {
    ChatInputCommandInteraction,
    Message,
    User,
    GuildMember,
    Guild,
    TextBasedChannel,
    Client,
    InteractionReplyOptions,
    MessageReplyOptions,
    Attachment,
    MessageFlags
} from "discord.js";

export class Context {
    public isInteraction: boolean;
    public interaction?: ChatInputCommandInteraction;
    public message?: Message;
    public args: string[];

    private replyMsg?: Message;
    private deferred = false;
    private replied = false;

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

    get author(): User {
        return this.isInteraction
            ? this.interaction!.user
            : this.message!.author;
    }

    get member(): GuildMember | null {
        return (
            this.isInteraction ? this.interaction!.member : this.message!.member
        ) as GuildMember | null;
    }

    get guild(): Guild | null {
        return this.isInteraction
            ? this.interaction!.guild
            : this.message!.guild;
    }

    get channel(): TextBasedChannel | null {
        return this.isInteraction
            ? this.interaction!.channel
            : this.message!.channel;
    }

    get client(): Client {
        return this.isInteraction
            ? this.interaction!.client
            : this.message!.client;
    }

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
