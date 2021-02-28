const Discord = require("discord.js")
	, Queue = require("bull");

class Client extends Discord.Client
{
	constructor(options)
	{
		super(options);

		this.utils = require("../utils");
		this.commands = new (require("./InteractionManager.js"))(this);
		this.events = new (require("../events"))(this);
		this.crons = new (require("../cron/Manager.js"))(this);
		this.queues = {
			announce: new Queue("twitch_announce", process.env.REDIS_URL || "redis://127.0.0.1:6379")
		};

		this.queues.announce.process((job, done) =>
		{
			const { event, streamer } = job;
			for (const channelID of process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS.split(/[\s,]/))
			{
				this.channels.fetch(channelID)
					.then(channel =>
					{
						channel.send(`🔴 Hey <&498969379086794753>, **Krook** just went live on Twitch! https://twitch.tv/${event.broadcaster_user_login}`)
							.catch(console.error);
					}).catch(console.error);
			}
		});
	}
}

module.exports = Client;
