const fs = require("fs-extra")
	, request = require("request")
	, EventEmitter = require("events")
	, isEqual = require("lodash.isequal");

class TwitterCredentials
{
	/* eslint-disable brace-style */
	get BEARER_TOKEN() { return this._token; }
	get APP_KEY() { return this._appKey; }
	get APP_SECRET() { return this._appSecret; }
	get ACCESS_TOKEN() { return this._accessToken; }
	get ACCESS_SECRET() { return this._accessSecret; }
	/* eslint-enable brace-style */

	constructor(credentials = {})
	{
		this._token = credentials.token || process.env.TWITTER_BEARER_TOKEN;
		this._appKey = credentials.appKey || process.env.TWITTER_APP_KEY;
		this._appSecret = credentials.appSecret || process.env.TWITTER_APP_SECRET;
		this._accessToken = credentials.appToken || process.env.TWITTER_ACCESS_TOKEN;
		this._accessSecret = credentials.accessSecret || process.env.TWITTER_ACCESS_SECRET;
	}
}

class TwitterRules
{
	get rulesPath()
	{
		return join(__datadir, "twitter-rules.json");
	}

	constructor(rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules", credentials = {})
	{
		this.rulesURL = rulesURL;
		this.credentials = new TwitterCredentials(credentials);

		if (!fs.existsSync(this.rulesPath))
			fs.outputJSON(this.rulesPath, {});

		this.request = request.defaults({
			method: "GET",
			url: this.rulesURL,
			json: true,
			headers: {
				"Authorization": `Bearer ${this.credentials.BEARER_TOKEN}`,
				"User-Agent": "krook-bot v1"
			}
		});
	}

	fetch(ids = [])
	{
		return new Promise((resolve, reject) =>
		{
			this.request({ qs: { ids } }, (err, res, body) =>
			{
				if (err)
					return reject(err);
				resolve(body.data);
			});
		});
	}

	create(data = [])
	{
		return new Promise((resolve, reject) =>
		{
			this.request({
				method: "POST",
				body: {
					add: Array.isArray(data) ? data : [ data ]
				}
			}, (err, res, body) =>
			{
				if (err || (body && body.errors))
					return reject(err || body.errors);
				resolve(body);
			});
		});
	}

	delete(ids = [])
	{
		return new Promise((resolve, reject) =>
		{
			this.request({
				method: "POST",
				body: {
					delete: {
						ids: Array.isArray(ids) ? ids : [ ids ]
					}
				}
			}, (err, res, body) =>
			{
				if (err || (body && body.errors))
					return reject(err || body.errors);
				resolve(body);
			});
		});
	}

	validate()
	{
		this.fetch()
			.then(rules =>
			{
				fs.readJSON(this.rulesPath)
					.then(tags =>
					{
						const to = {
							create: [],
							delete: []
						};

						for (const [ tag, value ] of Object.entries(tags))
						{
							const existing = rules.find(r => r.tag === tag);
							if (!existing)
							{
								to.create.push({
									tag,
									value: value.rule
								});
								continue;
							}

							if (!isEqual({
								tag: existing.tag,
								value: existing.value
							}, {
								tag,
								value: value.rule
							}))
							{
								to.create.push({
									tag,
									value: value.rule
								});
								continue;
							}
						}

						to.delete = rules.filter(r => !Object.keys(tags).includes(r.tag)).map(r => r.id);
						if (to.delete.length)
						{
							console.log(`[TWITTER-R] Deleting obsolete rule IDs: {${to.delete.join(", ")}}`);
							this.delete(to.delete)
								.catch(console.error);
						}

						if (to.create.length)
						{
							console.log(`[TWITTER-R] Creating or Updating rules: ${to.create.map(x => x.tag).join(", ")}`);
							this.create(to.create)
								.catch(console.error);
						}
					}).catch(console.error);
			}).catch(console.error);
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

module.exports = { TwitterCredentials, TwitterRules, TwitterStream };
