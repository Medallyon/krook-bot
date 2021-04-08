const Event = require(join(__libdir, "classes", "Event.js"))
	, fs = require("fs-extra");

class Twitter extends Event
{
	constructor(client)
	{
		super(client, "tweet");
	}

	trigger(tweet)
	{
		super.trigger(tweet);

		fs.readJSON(join(__datadir, "twitter-rules.json"))
			.then(tags =>
			{
				const matchingTag = tags[Object.keys(tags).find(t => tweet.rules.map(r => r.tag).includes(t))];
				if (!matchingTag)
					return console.warn(`[TWITTER-E] No tag found for {${tweet.rules.map(r => r.tag).join(",")}} in twitter-rules.json`);

				const channels = matchingTag.channels;
				for (let i = 0; i < channels.length; i++)
				{
					this.client.channels.fetch(channels[i])
						.then(channel =>
						{
							channel.send(`https://twitter.com/${tweet.author.username}/status/${tweet.id}`)
								.catch(console.error);
						}).catch(console.warn);
				}
			}).catch(console.error);
	}
}

module.exports = Twitter;
