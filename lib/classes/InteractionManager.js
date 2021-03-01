class WebInteraction
{
	constructor(payload)
	{
		this.id = payload.id;
		this.token = payload.token;
		this.type = payload.type;
		this.data = payload.data;
		this.guildID = payload.guild_id;
		this.channelID = payload.channel_id;
		this.member = payload.member;
		this.version = payload.version;

		this.options = {};
		for (const opt of this.data.options)
			this.options[opt.name] = opt;
	}
}

// transforms raw properties into discord.js-compatible objects
class ClientInteraction extends WebInteraction
{
	constructor(client, data)
	{
		super(data);
		this.client = client;
		this._init = false;

		this.mentions = [];
	}

	async init() /* eslint-disable brace-style */
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
		} catch (err) { console.error(err); }

		try
		{
			if (this.guildID != null)
			{
				this.guild = await this.client.guilds.fetch(this.guildID);
				delete this.guildID;
			}
		} catch (err) { console.error(err); }

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
		} catch (err) { console.error(err); }

		try
		{
			if (this.options.length)
			{
				const mentions = this.options.filter(x => x.type === 6);
				for (let i = 0; i < mentions.length; i++)
				{
					const user = await this.client.users.fetch(mentions[i].value);
					this.mentions.push(user);

					if (this.guild && this.guild.members.cache.has(user.id))
						this.mentions[i] = this.guild.member(user);
				}
			}
		} catch (err) { console.error(err); }

		this._init = true;
		Promise.resolve(this);
	} /* eslint-enable brace-style */
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
	, { determinePermissions } = require(join(__libdir, "utils"));

class InteractionManager
{
	constructor(client)
	{
		this.client = client;

		// register command modules
		const commands = require(join(__libdir, "commands"))(client);
		for (const [ key, cmd ] of Object.entries(commands))
			this[key] = cmd;

		// create event listener for interactions
		// will most likely move to default events in time
		this.client.ws.on("INTERACTION_CREATE", async interaction =>
		{
			const cInteraction = new ClientInteraction(this.client, interaction);
			await cInteraction.init();

			let cmd;
			for (const command of Object.values(this.client.commands))
			{
				if (command.name !== cInteraction.data.name)
					continue;

				cmd = command;
				break;
			}

			if (cmd == null)
				throw new Error(`Command '${cInteraction.data.name}' does not exist`);

			if (determinePermissions(cInteraction.member || cInteraction.user) < cmd.permission)
				throw new Error(`Member {${(cInteraction.member || cInteraction.user).id}} doesn't have permission to execute '${cInteraction.data.name}'`);

			try
			{
				request({
					method: "POST",
					uri: `https://discord.com/api/v8/interactions/${cInteraction.id}/${cInteraction.token}/callback`,
					json: true,
					headers: {
						"User-Agent": "krook-bot (https://github.com/medallyon/krook-bot, 1.0.0)"
					},
					body: {
						type: 5
					}
				});

				const respond = (response) =>
				{
					const res = new WebInteractionResponse(cmd.type, response);
					// client.api.interactions(cInteraction.id, cInteraction.token).callback.post({ data: res });
					cInteraction.channel.send(response.content, response.embeds[0])
						.catch(console.error);
				};

				let cmdResponse = cmd.run(cInteraction);
				if (cmdResponse instanceof Promise)
					return cmdResponse.then(respond)
						.catch(console.error);
				else
					respond(cmdResponse);
			}

			catch (err)
			{
				console.error(err);
			}
		});
	}
}

module.exports = InteractionManager;
