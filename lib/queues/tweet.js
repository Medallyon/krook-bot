const QueueProcessor = require(join(__libdir, "classes", "QueueProcessor.js"))
	, { TwitterStream } = require(join(__libdir, "classes", "Twitter.js"));

class TweetQ extends QueueProcessor
{
	constructor(client)
	{
		super(client, "tweet");

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
		const channelIDs = process.env.TWITTER_TWEET_ANNOUNCE_CHANNELS.split(/[\s,]/)
			, {
				includes,
				data: tweet,
				matching_rules: rules
			} = job.data;

		if (!rules.some(r => r.tag === "originals from krook"))
			return;

		tweet.author = includes.users[0];
		console.log("[TWITTER-Q]", tweet);
		for (let i = 0; i < channelIDs.length; i++)
		{
			this.client.channels.fetch(channelIDs[i])
				.then(channel =>
				{
					channel.send(`https://twitter.com/${tweet.author.username}/status/${tweet.id}`)
						.catch(console.error);
				})
				.finally(() =>
				{
					job.progress((i / channelIDs.length) * 100);
					if (i === channelIDs.length - 1)
						done();
				}).catch(console.error);
		}
	}
}

module.exports = TweetQ;
