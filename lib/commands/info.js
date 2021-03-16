const { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

class Info extends Command
{
	constructor(client)
	{
		super(client, 4, {
			permission: 100,
			name: "info",
			description: "What's this bot all about?"
		});
	}

	run(interaction)
	{
		const devs = process.env.DEVELOPERS.split(/[, ]/).map(x => `<@${x}>`);
		return new CommandResponse(new DefaultEmbed()
			.setAuthor(this.client.user.username, this.client.user.displayAvatarURL())
			.setDescription(`I'm a frog made by ${devs.slice(0, devs.length - 1).join(", ")}${devs.length > 1 ? (`${devs.length > 2 ? "," : ""} and ${devs.last()}`) : ""}.\nGet started by typing a \`/\` in chat and review my commands!`)
		);
	}
}

module.exports = Info;
