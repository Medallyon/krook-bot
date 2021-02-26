class Command
{
	get embed()
	{
		const embed = new this.client.utils.DefaultEmbed()
			.setAuthor(this.name)
			.setDescription(`${this.description}\n*Also known as: \`${this.alias.join("`, `")}\`*.`)
			.addField("Permission Value", this.permission);

		if (this.example)
			embed.addField("Example Usage", `\`${this.client.prefix}${this.name} ${this.example}\``);

		return embed;
	}

	constructor(client, moduleType, meta)
	{
		this.client = client;

		// Interaction Response Type
		this.type = moduleType;

		// Bool : whether this is a system module (only executed by crons, etc.)
		this.system = meta.system;
		// String
		this.name = meta.name;
		// Integer : this module's permission value
		this.permission = meta.permission;
		// Array<String> : alias names that are looked at when siphoning commands from a message
		this.alias = meta.alias;
		// String
		this.description = meta.description;
	}
}

const { MessageEmbed } = require("discord.js");

class CommandResponse
{
	constructor(content = "", embeds = null, tts = false, allowedMentions = {})
	{
		this.content = "";
		if (content instanceof MessageEmbed)
		{
			this.embeds = [ content ];
			embeds = tts;
			tts = allowedMentions;
		}

		else if (Array.isArray(content) && content.every(x => x instanceof MessageEmbed))
		{
			this.embeds = content;
			embeds = tts;
			tts = allowedMentions;
		}

		else
		{
			this.content = content;
			if (embeds != null && Array.isArray(embeds))
				this.embeds = embeds;
		}

		this.tts = tts;
		this.allowedMentions = allowedMentions;
	}
}

module.exports = { Command, CommandResponse };
