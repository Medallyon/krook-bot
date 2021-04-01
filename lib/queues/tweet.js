const fs = require("fs-extra")
	, QueueProcessor = require(join(__libdir, "classes", "QueueProcessor.js"))
	, { TwitterRules, TwitterStream } = require(join(__libdir, "classes", "Twitter.js"));

class TweetQ extends QueueProcessor
{
	constructor(client)
	{
		super(client, "tweet");

		this.rules = new TwitterRules();
		this.rules.validate();

		this.stream = new TwitterStream();
		this.stream.on("tweet", data =>
		{
			this.queue.add(data);
		})
			.connect()
			.then(() =>
			{
				console.log("[TWITTER] Connected to Twitter Stream.");
			}).catch(console.error);
	}

	processor(job, done)
	{
		fs.readJSON(this.rules.rulesPath)
			.then(tags =>
			{
				const {
					includes,
					data: tweet,
					matching_rules: rules
				} = job.data;

				const matchingTag = tags[Object.keys(tags).find(t => rules.map(r => r.tag).includes(t))];
				if (!matchingTag)
					return console.warn(`[TWITTER-Q] No tag found for {${rules.map(r => r.tag).join(",")}} in twitter-rules.json`);

				const channels = matchingTag.channels;
				tweet.author = includes.users[0];

				console.log("[TWITTER-Q]", tweet);
				for (let i = 0; i < channels.length; i++)
				{
					this.client.channels.fetch(channels[i])
						.then(channel =>
						{
							channel.send(`https://twitter.com/${tweet.author.username}/status/${tweet.id}`)
								.catch(console.error);
						})
						.finally(() =>
						{
							job.progress((i / channels.length) * 100);
							if (i === channels.length - 1)
								done();
						}).catch(console.error);
				}
			}).catch(console.error);
	}
}

module.exports = TweetQ;
