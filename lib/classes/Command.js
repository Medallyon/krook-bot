class Command
{
	get embed()
	{
		const embed = new this.client.utils.DefaultEmbed()
			.setAuthor(this.name)
			.setDescription(`${this.description}`)
			.addField("Permission Value", this.permission);

		if (this.example)
			embed.addField("Example Usage", `\`/${this.name} ${this.example}\``);

		return embed;
	}

	constructor(client, moduleType, meta)
	{
		this.client = client;

		// Interaction Response Type
		this.type = moduleType;

		// Bool : whether this is a system module (only executed by crons, etc.)
		this.system = meta.system;
		// Integer : this module's permission value
		this.permission = meta.permission;

		/*
		 * https://discord.com/developers/docs/interactions/slash-commands#applicationcommand
		 */

		// String
		this.name = meta.name.toLowerCase();
		// String
		this.description = meta.description;
		// Object
		this.options = meta.options;
	}
}

const { MessageEmbed } = require("discord.js");

class CommandResponse
{
	constructor(content, embeds = [], tts = false, allowedMentions = {})
	{
		this.content = "";
		if (content instanceof MessageEmbed)
			this.embeds = [ content/*.toJSON()*/ ];

		else if (Array.isArray(content) && content.every(x => x instanceof MessageEmbed))
			this.embeds = content/*.map(x => x.toJSON())*/;

		else
		{
			this.content = content;
			if (embeds != null && Array.isArray(embeds))
				this.embeds = embeds.filter(x => x instanceof MessageEmbed)/*.map(x => x.toJSON())*/;
		}

		this.tts = tts;
		this.allowed_mentions = allowedMentions;
	}
}

module.exports = { Command, CommandResponse };
