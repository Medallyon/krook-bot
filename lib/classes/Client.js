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
			const { event, streamer, stream } = job.data
				, channelIDs = Array.isArray(process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS)
					? process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS
					: process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS.split(/[\s,]/);

			if (stream.type !== "live")
				return console.warn("[TWITCH]", streamer.display_name, "is not actually live");

			for (let i = 0; i < channelIDs.length; i++)
			{
				this.channels.fetch(channelIDs[i])
					.then(channel =>
					{
						const embed = new this.utils.DefaultEmbed()
							.setColor("#6441a4")
							.setAuthor(streamer.display_name, `https://twitch.tv/${streamer.login}`, streamer.profile_image_url)
							.setThumbnail(streamer.profile_image_url)
							.setTitle(stream.title)
							.setURL(`https://twitch.tv/${streamer.login}`)
							.setImage(stream.thumbnail_url)
							.addField("Game", stream.game_name || "Just Chatting", true)
							.addField("Current Viewers", stream.viewer_count || 0, true)
							.setTimestamp(new Date(stream.started_at));

						if (stream.tags != null)
							embed.addField("Stream Tags", stream.tags.map(x => `[${x.localization_names["en-us"]}]{https://twitch.tv/directory/all/tags/${x.tag_id}}`).join(", "));

						// TODO: Replace debugging role ID with real role ID
						channel.send("🔴 Hey <@&660519109230067713>, **Krook** just went live on Twitch!", { embed })
							.catch(console.error);
					})
					.finally(() =>
					{
						if (i === channelIDs.length - 1)
							done();
					}).catch(console.error);
			}
		});
	}
}

module.exports = Client;
