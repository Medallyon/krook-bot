const throng = require("throng")
	, Discord = require("discord.js")
	, Queue = require("bull")
	, request = require("request")
	, { WebInteraction, WebInteractionResponse } = require(join(__webdir, "classes", "WebInteraction.js"));

const ApplicationCommandOptionType = { SUB_COMMAND: 1, SUB_COMMAND_GROUP: 2, STRING: 3, INTEGER: 4, BOOLEAN: 5, USER: 6, CHANNEL: 7, ROLE: 8 };

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

class InteractionWorker
{
	static get REDIS_URL()
	{
		return process.env.REDIS_URL || "redis://127.0.0.1:6379";
	}

	static get MAX_JOBS_PER_WORKER()
	{
		return 10;
	}

	static get WORKERS()
	{
		return process.env.WEB_CONCURRENCY || 1;
	}

	constructor(client)
	{
		this.client = client;
		this.request = request.defaults({
			baseUrl: "https://discord.com/api/v8",
			method: "PATCH",
			json: true,
			headers: {
				"User-Agent": "Krook-Bot (https://krook-bot.herokuapp.com/, 1.0.0)"
			}
		});

		// Initialize the clustered worker process
		/*throng({
			count: InteractionWorker.WORKERS,
			worker: this.init.bind(this),
			grace: 1000
		});*/

		// Connect to the named work queue
		this.workQueue = new Queue("interactions", InteractionWorker.REDIS_URL);
		this.workQueue.process(InteractionWorker.MAX_JOBS_PER_WORKER, async (job, done) =>
		{
			// determine which command is going to be executed based on interaction data
			const cInteraction = await ClientInteraction.from(job.data, this.client);

			let cmd;
			for (const command of Object.values(this.client.commands))
			{
				if (command.name !== cInteraction.data.name)
					continue;

				cmd = command;
				break;
			}

			console.log(cInteraction.data.name);

			if (cmd == null)
				throw new Error(`Command '${cInteraction.data.name}' does not exist`);

			cmd.run(cInteraction)
				.then(response =>
				{
					console.log(response);
					const body = new WebInteractionResponse(response);

					// TODO: follow-up (https://discord.com/developers/docs/interactions/slash-commands#followup-messages)

					console.log("following up...");
					this.request(`/webhooks/${process.env.DISCORD_CLIENT_ID}/${cInteraction.token}/messages/@original`, { body }, done);
				}).catch(done);
		});
	}
}

module.exports = InteractionWorker;
