const request = require("request")
	, EventEmitter = require("events");

class TwitterCredentials
{
	/* eslint-disable brace-style */
	get BEARER_TOKEN() { return this._token || process.env.TWITTER_BEARER_TOKEN; }
	get APP_KEY() { return this._appKey || process.env.TWITTER_APP_KEY; }
	get APP_SECRET() { return this._appSecret || process.env.TWITTER_APP_SECRET; }
	get ACCESS_TOKEN() { return this._accessToken || process.env.TWITTER_ACCESS_TOKEN; }
	get ACCESS_SECRET() { return this._accessSecret || process.env.TWITTER_ACCESS_SECRET; }
	/* eslint-enable brace-style */

	constructor(credentials = {})
	{
		this._token = credentials.token;
		this._appKey = credentials.appKey;
		this._appSecret = credentials.appSecret;
		this._accessToken = credentials.appToken;
		this._accessSecret = credentials.accessSecret;
	}
}

class TwitterStream extends EventEmitter
{
	constructor(streamURL = "https://api.twitter.com/2/tweets/search/stream", credentials = {})
	{
		super();

		this.streamURL = streamURL;
		this.credentials = new TwitterCredentials(credentials);

		this.request = request.defaults({
			method: "GET",
			headers: {
				"Authorization": `Bearer ${this.credentials.BEARER_TOKEN}`,
				"User-Agent": "krook-bot v1"
			},
			qs: {
				"expansions": [ "author_id" ].join(","),
				"tweet.fields": [ "author_id", "created_at" ].join(",")
			}
		});
	}

	connect(retryAttempt = 0)
	{
		return new Promise((resolve, reject) =>
		{
			const reconnect = (errMsg) =>
			{
				// This reconnection logic will attempt to reconnect when a disconnection is detected.
				// To avoid rate limits, this logic implements exponential backoff, so the wait time
				// will increase if the client cannot reconnect to the stream.
				console.warn(`[TWITTER] A connection error occurred: ${errMsg}. Reconnecting to stream in ${retryAttempt ** 2} seconds..`);
				setTimeout(() =>
				{
					this.connect(++retryAttempt)
						.then(resolve);
				}, 1000 * (retryAttempt ** 2));
			};

			const stream = this.request(this.streamURL);
			stream.on("data", data =>
			{
				try
				{
					data = JSON.parse(data);
					if (data.connection_issue)
						return reconnect(data.connection_issue);
					else if (data.errors)
						return reject(data.errors);

					retryAttempt = 0;
					this.emit("tweet", data);
				}

				catch (err)
				{
					// success
					// JSON.parse failed, meaning an empty keep-alive signal was received - do nothing
				}

				resolve(stream);
			}).on("err", error =>
			{
				if (error.code !== "ECONNRESET")
					reject(error);
				else
					reconnect("ECONNRESET");
			});
		});
	}
}

module.exports = { TwitterCredentials, TwitterStream };
