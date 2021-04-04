const DI = require("better-discord-interactions");

class WebInteraction
{
	constructor(payload)
	{
		this.id = payload.id;
		this.token = payload.token;
		this.type = payload.type;
		this.command = payload.data;
		this.guildID = payload.guild_id;
		this.channelID = payload.channel_id;
		this.member = payload.member;
		this.version = payload.version;

		this.arguments = {};
		if (Array.isArray(this.command.options))
			for (const arg of this.command.options)
				this.arguments[arg.name] = arg;
	}
}

class WebInteractionResponse
{
	constructor(type, cmdResponse)
	{
		this.type = type;
		this.data = cmdResponse;
	}
}

const request = require("request")
	, { CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

// transforms raw properties into discord.js-compatible objects
class ClientInteraction extends WebInteraction
{
	_generateErrorEmbed(err)
	{
		return new DefaultEmbed()
			.setColor("#f04747")
			.setAuthor("Something unexpected happened.")
			.setDescription(`While trying to process the \`${this.command.name}\` command, an error ocurred:\n\`\`\`js\n${err.message}\`\`\``)
			.addField("\u200b", "If this keeps happening, please contact a developer.");
	}

	async init() /* eslint-disable brace-style, no-empty */
	{
		if (this._init)
			return Promise.resolve(this);

		try
		{
			if (this.channelID != null)
			{
				this.channel = await this.client.channels.fetch(this.channelID);
				delete this.channelID;
			}
		} catch (err) {}

		try
		{
			if (this.guildID != null)
			{
				this.guild = await this.client.guilds.fetch(this.guildID);
				delete this.guildID;
			}
		} catch (err) {}

		try
		{
			if (this.member != null)
			{
				const user = await this.client.users.fetch(this.member.user.id);
				if (this.guild)
					this.member = this.guild.member(user);
				else
				{
					this.user = user;
					delete this.member;
				}
			}
		} catch (err) {}

		try
		{
			if (Object.keys(this.arguments).length)
			{
				const mentions = Object.values(this.arguments).filter(x => x.type === 6);
				for (let i = 0; i < mentions.length; i++)
				{
					const user = await this.client.users.fetch(mentions[i].value);
					this.mentions.push(user);

					if (this.guild && this.guild.members.cache.has(user.id))
						this.mentions[i] = this.guild.member(user);
				}
			}
		} catch (err) {}

		this._init = true;
		Promise.resolve(this);
	} /* eslint-enable brace-style, no-empty */

	constructor(client, data)
	{
		super(data);
		this.client = client;
		this._init = false;
		this._responded = false;

		this.followup = request.defaults({
			method: "PATCH",
			uri: `https://discord.com/api/v8/webhooks/${this.client.user.id}/${this.token}/messages/@original`,
			json: true,
			headers: {
				"User-Agent": "krook-bot (https://github.com/medallyon/krook-bot, 1.0.0)"
			}
		});
		this.mentions = [];
	}

	_followup(cmdRes)
	{
		let body;
		if (cmdRes instanceof CommandResponse)
			body = cmdRes;

		else if (cmdRes instanceof Error)
			body = new CommandResponse(this._generateErrorEmbed(cmdRes));

		this.followup({ body }, (err, r, body) =>
		{
			if (err || body.errors)
				console.error(err || body.errors);
		});
	}

	respond(res)
	{
		return this._followup(res);
	}
}

module.exports = {
	WebInteraction,
	WebInteractionResponse,
	ClientInteraction
};
