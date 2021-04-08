const Event = require(join(__libdir, "classes", "Event.js"))
	, fs = require("fs-extra");

class Twitter extends Event
{
	constructor(client)
	{
		super(client, "twitch-live");
	}

	trigger(data)
	{
		super.trigger(data);

		const { event, streamer, stream } = data;
		fs.readJSON(join(__datadir, "twitch-rules.json"))
			.catch(console.error)
			.then(rules =>
			{
				const matchingStreamer = rules[Object.keys(rules).find(x => x.toLowerCase() === streamer.login.toLowerCase())];
				if (!matchingStreamer)
					return console.warn(`[Twitch-E] No rule found for {${streamer.login}} in twitch-rules.json`);

				if (stream && stream.type !== "live")
					return console.warn(`[TWITCH-E] {${streamer.display_name}} is not actually live. Aborting.."`);

				const channelIDs = matchingStreamer.channels;
				for (let i = 0; i < channelIDs.length; i++)
				{
					this.client.channels.fetch(channelIDs[i])
						.catch(console.error)
						.then(channel =>
						{
							const customContent = matchingStreamer.message
								, message = {
									content: ((typeof customContent) === "string" && customContent.length) ? customContent : undefined
								};

							if (stream)
							{
								message.embed = new this.client.utils.DefaultEmbed()
									.setColor("#6441a4")
									.setAuthor(streamer.display_name, streamer.profile_image_url, `https://twitch.tv/${streamer.login}`)
									.setThumbnail(streamer.profile_image_url)
									.setTitle(stream.title)
									.setURL(`https://twitch.tv/${streamer.login}`)
									.setImage(stream.thumbnail_url
										.replace("{width}", 1024)
										.replace("{height}", 720))
									.addField("Game", stream.game_name || "Just Chatting", true)
									.addField("Current Viewers", stream.viewer_count || 0, true)
									.setTimestamp(new Date(stream.started_at));

								if (stream.tags != null)
									message.embed.addField("Stream Tags", stream.tags.map(x => `[${x.localization_names["en-us"]}](https://twitch.tv/directory/all/tags/${x.tag_id})`).join(", "));
							}

							else
								message.content += `\nhttps://twitch.tv/${event.broadcaster_user_login}`;

							channel.send(message)
								.then(msg =>
								{
									if (msg.crosspostable)
										msg.crosspost()
											.catch(console.warn);
								}).catch(console.error);
						});
				}
			});
	}
}

module.exports = Twitter;
