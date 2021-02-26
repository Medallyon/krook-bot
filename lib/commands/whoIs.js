const moment = require("moment")
	, { Command, CommandResponse } = require("../classes/Command.js")
	, { DefaultEmbed, generateRandomColor } = require("../utils");

class WhoIs extends Command
{
	constructor(client)
	{
		super(client, 4, {
			name: "whois",
			alias: [ "me", "who", "user", "info" ],
			description: "Displays info about you or a mentioned user.",
			permission: 100,
		});
	}

	buildEmbed(member)
	{
		const avatarURL = (member.user || member).displayAvatarURL()
			, color = member.displayColor || generateRandomColor();
		const embed = new DefaultEmbed()
			.setColor(color)
			.setAuthor(member.tag || member.user.tag, avatarURL)
			.setImage(avatarURL);

		if (member.nickname)
			embed.addField("Nickname", member.nickname, true);

		if (member.guild)
			embed.setDescription(`**${member.user.username}** has been part of this server since ${moment(member.joinedAt).format("MMMM YYYY")}.`)
				.addField("# of Roles", member.roles.cache.size - 1, true)
				.addField("Highest Role", member.roles.highest.toString(), true)
				.addField("Joined Date", member.joinedAt.toUTCString());

		embed.addField("Creation Date", (member.createdAt || member.user.createdAt).toUTCString());

		return embed;
	}

	async run(interaction)
	{
		let user = interaction.guild ? interaction.member : interaction.user;
		if (interaction.options.length && interaction.guild)
		{
			try
			{
				user = await interaction.guild.member(this.client.users.fetch(interaction.options[0].value));
			}

			catch (err)
			{
				console.error(err);
			}
		}

		return Promise.resolve(new CommandResponse(this.buildEmbed(user)));
	}
}

module.exports = WhoIs;
