const Discord = require("discord.js")
	, CronManager = require("../cron/Manager.js")
	, Queue = require("bull");

const DEFAULT_PREFIX = "/";

class Client extends Discord.Client
{
	get prefix()
	{
		return process.env.BOT_PREFIX || DEFAULT_PREFIX;
	}

	constructor(options)
	{
		super(options);

		this.utils = require("../utils");
		this.commands = new (require("../commands"))(this);
		this.events = new (require("../events"))(this);

		this.crons = new CronManager(this);

		this.queues = {
			announce: new Queue("twitch_announce", process.env.REDIS_URL || "redis://127.0.0.1:6379")
		};

		this.queues.announce.process((job, done) =>
		{
			const { event, streamer } = job;
			const embed = new this.utils.DefaultEmbed()
				.setColor("#9147ff")
				.setAuthor("Hey Gamers, Krook just went live on Twitch!", "https://cdn0.iconfinder.com/data/icons/social-network-7/50/16-512.png", `https://twitch.tv/TheMasterKrook`)
				.setDescription("https://twitch.tv/TheMasterKrook")
				.setThumbnail("https://cdn.discordapp.com/icons/417356897369325568/332831da3e8befcb5c3576ed91311bb4.webp?size=256" || streamer.profile_image_url)
				.setTimestamp(new Date(event.started_at))
				.setFooter("Powered by Krook", "https://cdn.discordapp.com/avatars/421809154936537090/96ae47e415a5c2ed45e2922eaf6e52bc.webp?size=128");

			for (const channelID of process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS.split(/[\s,]/))
			{
				this.channels.fetch(channelID)
					.then(channel =>
					{
						channel.send(embed)
							.catch(console.error);

						// channel.send(`🔴 Hey Gamers, **Krook** just went live on Twitch! https://twitch.tv/${event.broadcaster_user_login}`)
						//     .catch(console.error);
						// channel.send(`🔴 Hey Gamers, **Krook** just went live on Twitch! https://twitch.tv/TheMasterKrook`)
						//     .catch(console.error);
					}).catch(console.error);
			}
		});
	}
}

module.exports = Client;
