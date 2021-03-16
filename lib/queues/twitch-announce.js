const QueueProcessor = require(join(__libdir, "classes", "QueueProcessor.js"));

class TwitchAnnounceQ extends QueueProcessor
{
	constructor(client)
	{
		super(client);
	}

	processor(job, done)
	{
		const { event, streamer, stream } = job.data
			, channelIDs = Array.isArray(process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS)
				? process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS
				: process.env.TWITCH_LIVE_ANNOUNCE_CHANNELS.split(/[\s,]/);

		if (stream.type !== "live")
			return console.warn("[TWITCH]", streamer.display_name, "is not actually live");

		for (let i = 0; i < channelIDs.length; i++)
		{
			this.client.channels.fetch(channelIDs[i])
				.then(channel =>
				{
					const embed = new this.client.utils.DefaultEmbed()
						.setColor("#6441a4")
						.setAuthor(streamer.display_name, streamer.profile_image_url, `https://twitch.tv/${streamer.login}`)
						.setThumbnail(streamer.profile_image_url)
						.setTitle(stream.title)
						.setURL(`https://twitch.tv/${streamer.login}`)
						.setImage(stream.thumbnail_url
							.replace("{width}", 1920)
							.replace("{height}", 1080))
						.addField("Game", stream.game_name || "Just Chatting", true)
						.addField("Current Viewers", stream.viewer_count || 0, true)
						.setTimestamp(new Date(stream.started_at));

					if (stream.tags != null)
						embed.addField("Stream Tags", stream.tags.map(x => `[${x.localization_names["en-us"]}]{https://twitch.tv/directory/all/tags/${x.tag_id}}`).join(", "));

					channel.send("<@&498969379086794753>, **Krook** just went live on Twitch!", { embed })
						.catch(console.error);
				})
				.finally(() =>
				{
					if (i === channelIDs.length - 1)
						done();
				}).catch(console.error);
		}
	}
}

module.exports = TwitchAnnounceQ;
