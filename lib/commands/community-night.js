const { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, DI = require("better-discord-interactions");

class CommunityNight extends Command
{
	constructor(client)
	{
		super(client, DI.InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE, {
			permission: 400,
			name: "community-night",
			description: "Frick with community night settings, ya know?",
			options: [
				{
					name: "announce",
					description: "Announce that community night is a go!",
					type: DI.ApplicationCommandOptionType.SUB_COMMAND,
					options: [
						{
							name: "channel",
							description: "The channel you want to announce this in.",
							type: DI.ApplicationCommandOptionType.CHANNEL,
							required: true
						},
						{
							name: "message",
							description: "A message to along with your announcement.",
							type: DI.ApplicationCommandOptionType.STRING
						},
						{
							name: "mention",
							description: "A role you want to mention with your announcement.",
							type: DI.ApplicationCommandOptionType.ROLE
						}
					]
				},
				{
					name: "toggle",
					description: "Toggle community night on or off.",
					type: DI.ApplicationCommandOptionType.SUB_COMMAND,
					options: [
						{
							name: "category",
							description: "Which category should be adjusted?",
							type: DI.ApplicationCommandOptionType.CHANNEL,
							required: true
						},
						{
							name: "visible",
							description: "Whether the community night channels should be visible.",
							type: DI.ApplicationCommandOptionType.BOOLEAN,
							required: true
						}
					]
				}
			]
		});
	}

	async run(interaction)
	{
		if (!interaction.guild)
			return Promise.reject(new Error("This command can only be executed on a valid server."));

		let args = interaction.arguments;
		if (args.toggle)
		{
			args = args.toggle;

			const everyone = interaction.guild.roles.cache.get(interaction.guild.id)
				, category = interaction.guild.channels.cache.get(args.category.value);

			await category.updateOverwrite(everyone, { VIEW_CHANNEL: args.visible.value });
			console.log(interaction.guild.channels.cache.filter(x => x.type === "category").size - 1);
			await category.setPosition(args.visible.value ? 0 : interaction.guild.channels.cache.filter(x => x.type === "category").size - 1);
		}

		else if (args.announce)
		{
			args = args.announce;

			const channel = interaction.guild.channels.cache.get(args.channel.value);
			if (![ "text", "news", "dm" ].some(x => x === channel.type))
				return Promise.reject(new Error("The channel needs to be a text-based channel."));

			const msg = await channel.send((args.mention ? `<@&${args.mention.value}> ` : "") + (args.message ? args.message.value : "Community Night is starting! Get in here <a:Meltdown:710838732168888413>"));
			if (msg.crosspostable)
				await msg.crosspost();
		}
	}
}

module.exports = CommunityNight;
