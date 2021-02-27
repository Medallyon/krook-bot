const request = require("request");

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
	}

	_fetchUser(qs)
	{
		return new Promise((resolve, reject) =>
		{
			this.request("/users", { qs }, (err, res, body) =>
			{
				if (err)
					return reject(err);
				resolve(body.data[0]);
			});
		});
	}

	get users()
	{
		return {
			fetch: this._fetchUser.bind(this)
		};
	}
}

module.exports = Twitch;
