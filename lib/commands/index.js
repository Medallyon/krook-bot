const join = require("path").join
	, fs = require("fs");

class WebInteraction
{
	constructor(payload)
	{
		this.id = payload.id;
		this.token = payload.token;
		this.type = payload.type;
		this.data = payload.data;
		this.options = payload.data.options || [];
		this.guildID = payload.guild_id;
		this.channelID = payload.channel_id;
		this.member = payload.member;
		this.version = payload.version;
	}
}

// transforms raw properties into discord.js-compatible objects
class ClientInteraction extends WebInteraction
{
	static async from(webInteraction, client)
	{
		const cInteraction = new ClientInteraction(client, Object.assign({}, webInteraction, {
			guild_id: webInteraction.guildID,
			channel_id: webInteraction.channelID
		}));

		await cInteraction.init();
		return cInteraction;
	}

	async init()
	{
		if (this._init)
			return Promise.resolve();

		try
		{
			if (this.guildID != null)
			{
				this.guild = await this.client.guilds.fetch(this.guildID);
				delete this.guildID;
			}

			if (this.channelID != null)
			{
				this.channel = await this.client.channels.fetch(this.channelID);
				delete this.channelID;
			}

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
		}

		catch (err)
		{
			console.error(err);
			return Promise.reject(err);
		}

		this._init = true;
		Promise.resolve();
	}

	constructor(client, data = {})
	{
		super(data);
		this.client = client;
		this._init = false;
	}
}

class WebInteractionResponse
{
	constructor(type, cmdResponse)
	{
		this.type = type;

		/*
		 * tts?					|	boolean				|	is the response TTS
		   content				|	string				|	message content
		   embeds?				|	array of embeds		|	supports up to 10 embeds
		   allowed_mentions?	|	allowed mentions	|	{ allowed mentions } object
		 */
		this.data = cmdResponse;
	}
}

class Commands
{
	constructor(client)
	{
		this.client = client;

		const files = fs.readdirSync(__dirname);
		for (const file of files)
		{
			if (file === "index.js")
				continue;

			const filePath = join(__dirname, file);
			this[file.replace(".js", "")] = new (require(filePath))(client);
		}

		this.client.ws.on("INTERACTION_CREATE", async interaction =>
		{
			console.log(interaction);
			const cInteraction = await ClientInteraction.from(interaction, this.client);

			let cmd;
			for (const command of Object.values(this.client.commands))
			{
				if (command.name !== cInteraction.data.name)
					continue;

				cmd = command;
				break;
			}

			if (cmd == null)
				return new Error(`Command '${cInteraction.data.name}' does not exist`);

			try
			{
				const cmdResponse = await cmd.run(cInteraction);
				const data = new WebInteractionResponse(cmd.type, cmdResponse);

				console.log("\nfollowing up with", data);
				client.api.interactions(interaction.id, interaction.token).callback.post({ data });
			}

			catch (err)
			{
				console.error(err);
			}
		});
	}
}

module.exports = Commands;
