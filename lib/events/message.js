const Discord = require("discord.js")
	, Event = require(join(__libdir, "classes", "Event.js"));

class Message extends Event
{
	constructor(client)
	{
		super(client, "message");
	}

	trigger(msg)
	{
		super.trigger(msg);

		const time = msg.createdAt.toUTCString()
			, content = `${msg.bot ? "[BOT] " : ""}${msg.author.tag}: "${msg.content.length ? msg.cleanContent : (msg.attachments.size ? "[IMAGE]" : "[EMBED]")}"`
			, location = `${"#" + (msg.channel.name || msg.channel.recipient.id)}${msg.guild ? (` - {${msg.guild.name}}`) : ""}`;

		console.log(`\n${time}\n${content}\n${location}`);
	}
}

module.exports = Message;
