const { MessageEmbed } = require("discord.js");

/**
 * The base Command.
 * @typedef {Object} Command
 */
class Command
{
	/**
	 * @return {MessageEmbed} A human-readable Rich Embed for this command.
	 */
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

	/**
	 * @param {DiscordClient} client The client that instantiated this command
	 * @param {Number} moduleType The type of response that this module acts on
	 * @param {Object} meta The general info about this module
	 */
	constructor(client, moduleType, meta)
	{
		/**
		 * @type {Client}
		 */
		this.client = client;

		// Interaction Response Type
		this.type = moduleType;

		// Bool : whether this is a system module (only executed by crons, etc.)
		this.system = meta.system || false;
		// Integer : this module's permission value
		this.permission = meta.permission || 100;

		// String
		this.name = meta.name.toLowerCase();
		// String
		this.description = meta.description;
		// Object
		this.options = meta.options;
	}
}

/**
 * The Response returned by every Command's `run` method
 */
class CommandResponse
{
	/**
	 * @param {String|MessageEmbed|Array<MessageEmbed>} content The content of the Response
	 * @param {Array<MessageEmbed>} [embeds=[]] An optional array of Rich Embeds
	 * @param {Boolean} [tts=false] [description]
	 * @param {Object}  [allowedMentions={}] [description]
	 */
	constructor(content, embeds = [], tts = false, allowedMentions = {})
	{
		/**
		 * Message content
		 * @type {String}
		 */
		this.content = "";
		/**
		 * Rich Embeds attached to this response
		 * @type {Array}
		 */
		this.embeds = [];

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

		/**
		 * Whether text-to-speech is enabled
		 * @type {Boolean}
		 */
		this.tts = tts;
		/**
		 * The roles that are allowed to be mentioned in this response
		 * @type {Array<Snowflake>}
		 */
		this.allowed_mentions = allowedMentions;
	}
}

module.exports = { Command, CommandResponse };
