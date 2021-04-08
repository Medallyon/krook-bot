const Discord = require("discord.js")
	, { TwitterRules, TwitterStream } = require(join(__libdir, "classes", "Twitter.js"))
	, Twitch = require(join(__libdir, "classes", "Twitch.js"));

/* A custom Discord.Client class */
class Client extends Discord.Client
{
	constructor(options)
	{
		super(options);

		this.utils = require("../utils");
		this.commands = new (require("../commands"))(this);
		this.events = new (require("../events"))(this);

		this.crons = new (require("../cron/Manager.js"))(this);
		this.interactions = new (require("./InteractionManager.js"))(this);

		this.twitter = {
			rules: new TwitterRules(),
			stream: new TwitterStream()
		};

		this.twitter.rules.validate();
		this.twitter.stream.on("tweet", tweet =>
		{
			this.emit("tweet", tweet);
		})
			.connect()
			.then(() =>
			{
				console.log("[TWITTER] Connected to Stream.");
			}).catch(console.error);

		this.twitch = new Twitch();
		this.twitch.init();
	}
}

module.exports = Client;
