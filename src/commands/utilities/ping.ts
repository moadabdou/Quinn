import { Command } from "../../types";

const ping: Command = {
    name: "ping",
    description: "Check bot latency",
    category: "utility",

    async execute(ctx) {
        const sent = await ctx.reply("Pinging...");

        const latency = sent.createdTimestamp - ctx.createdTimestamp;

        await ctx.editReply(`Latency: ${latency}ms`);
    }
};

export default ping;
