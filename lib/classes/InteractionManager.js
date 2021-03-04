const { InteractionResponseType } = require("discord-interactions")
	, { CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

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
			method: "POST",
			uri: `https://discord.com/api/v8/webhooks/${this.client.user.id}/${this.token}`,
			json: true,
			headers: {
				"User-Agent": "krook-bot (https://github.com/medallyon/krook-bot, 1.0.0)"
			}
		});
		this.mentions = [];
	}

	_followup(res)
	{
		let body;
		if (res instanceof CommandResponse)
			body = res;

		else if (res instanceof Error)
			body = new CommandResponse(this._generateErrorEmbed(res));

		this.followup({ body }, (err, r, body) =>
		{
			if (err || body.errors)
				console.error(err || body.errors);
		});
	}

	_sendMessage(res)
	{
		this.channel.stopTyping(true);

		let args;
		if (res instanceof CommandResponse)
			args = [ res.content, res.embeds[0] ];

		else if (res instanceof Error)
			args = [ this._generateErrorEmbed(res) ];

		this.channel.send(...args)
			.catch(console.error);
	}

	respond(res)
	{
		if (!this.channel)
			return this._followup(res);
		this._sendMessage(res);
	}
}

const request = require("request")
	, { determinePermissions } = require(join(__libdir, "utils"));

class InteractionManager
{
	constructor(client)
	{
		this.client = client;
		this.respond = request.defaults({
			method: "POST",
			baseUrl: "https://discord.com/api/v8/interactions",
			json: true,
			headers: {
				"User-Agent": "krook-bot (https://github.com/medallyon/krook-bot, 1.0.0)"
			}
		});

		// register command modules
		const commands = require(join(__libdir, "commands"))(client);
		for (const [ key, cmd ] of Object.entries(commands))
			this[key] = cmd;

		// create event listener for interactions
		// will most likely move to built-in Client.events in time
		this.client.ws.on("INTERACTION_CREATE", async interaction =>
		{
			const cInteraction = new ClientInteraction(this.client, interaction);
			await cInteraction.init();

			let cmd = Object.values(this.client.commands).find(c => c.name === cInteraction.command.name);
			if (cmd == null)
				throw new Error(`Command '${cInteraction.command.name}' does not exist`);

			if (determinePermissions(cInteraction.member || cInteraction.user) < cmd.permission)
				this.respond(`${cInteraction.id}/${cInteraction.token}/callback`, {
					body: new WebInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, new CommandResponse(cInteraction._generateErrorEmbed("You do not have permission to call this command.")))
				});

			this.respond(`${cInteraction.id}/${cInteraction.token}/callback`, {
				body: new WebInteractionResponse(InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE)
			}, err =>
			{
				if (err)
					console.error(err);

				if (cInteraction.channel)
					cInteraction.channel.startTyping()
						.catch(console.error);

				let cmdResponse;
				try
				{
					cmdResponse = cmd.run(cInteraction);
				}

				catch (err)
				{
					console.error(err);
					cmdResponse = err;
				}

				if (cmdResponse instanceof Promise)
					return cmdResponse.then(cInteraction.respond.bind(cInteraction))
						.catch(cInteraction.respond.bind(cInteraction));
				else
					cInteraction.respond(cmdResponse);
			});
		});
	}
}

module.exports = InteractionManager;
