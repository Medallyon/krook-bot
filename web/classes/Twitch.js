const request = require("request")
	, Cache = require("node-cache");

class Twitch
{
	_fetchBearerToken()
	{
		return new Promise((resolve, reject) =>
		{
			request({
				method: "POST",
				uri: "https://id.twitch.tv/oauth2/token",
				json: true,
				useQueryString: true,
				qs: {
					grant_type: "client_credentials",
					client_id: process.env.TWITCH_CLIENT_ID,
					client_secret: process.env.TWITCH_CLIENT_SECRET,
					scope: ""
				}
			}, (err, res, body) =>
			{
				if (err)
					return reject(err);

				this._bearer = body.access_token;
				resolve(this._bearer);

				setTimeout(() =>
				{
					this._fetchBearerToken()
						.catch(console.error);
				}, Math.min(body.expires_in * 1000, 2147483647));
			});
		});
	}

	async init()
	{
		if (this._init)
			return Promise.resolve();

		try
		{
			this.bearer = await this._fetchBearerToken();
			this.request = request.defaults({
				baseUrl: "https://api.twitch.tv/helix",
				useQueryString: true,
				json: true,
				headers: {
					"Client-ID": process.env.TWITCH_CLIENT_ID,
					"Authorization": `Bearer ${this.bearer}`
				}
			});
		}

		catch(err)
		{
			console.error(err);
			return Promise.reject(err);
		}

		this._init = true;
		Promise.resolve();
	}

	constructor()
	{
		this._init = false;
		this.bearer = null;
		this.request = null;

		// cache for 2 days
		this._users = new Cache({ stdTTL: 1000 * 60 * 60 * 24 * 2 });
		this._tags = new Cache({ stdTTL: 1000 * 60 * 60 * 24 * 2 });
		// don't cache streams because every stream will be different
	}

	get tags()
	{
		return {
			fetch: this._fetchTag.bind(this)
		};
	}

	_fetchTag(tag_id)
	{
		return new Promise((resolve, reject) =>
		{
			if (this._tags.has(tag_id))
				return resolve(this._tags.get(tag_id));

			this.request("/tags/streams", { tag_id }, (err, res, body) =>
			{
				if (err)
					return reject(err);
				resolve(body.data[0]);
				this._tags.set(tag_id, body.data[0]);
			});
		});
	}

	get users()
	{
		return {
			fetch: this._fetchUser.bind(this)
		};
	}

	_fetchUser(id)
	{
		return new Promise((resolve, reject) =>
		{
			if (this._users.has(id))
				return resolve(this._users.get(id));

			this.request("/users", { id }, (err, res, body) =>
			{
				if (err)
					return reject(err);
				resolve(body.data[0]);
				this._users.set(id, body.data[0]);
			});
		});
	}

	get streams()
	{
		return {
			fetch: this._fetchStream.bind(this)
		};
	}

	_fetchStream(id)
	{
		return new Promise((resolve, reject) =>
		{
			this.request("/streams", { id }, (err, res, body) =>
			{
				if (err)
					return reject(err);

				const stream = body.data[0];
				if (stream.tag_ids.every(tag => this._tags.has(tag)))
				{
					stream.tags = stream.tag_ids.map(tag => this._tags.get(tag));
					return resolve(stream);
				}

				this.request("/streams/tags", { id }, (err, res, tags) =>
				{
					if (err)
						return reject(err);

					for (const tag of tags.data)
						this._tags.set(tag.tag_id, tag);

					stream.tags = tags.data;
					resolve(stream);
				});
			});
		});
	}
}

module.exports = Twitch;
