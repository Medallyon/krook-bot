const request = require("request")
	, Cache = require("node-cache")
	, { DefaultEmbed } = require(join(__libdir, "utils"));

/**
 * @typedef {UnsplashImageData}
 * @type {Object}
 */
const UnsplashImageData = {
	color: String,
	description: String,
	user: Object,
	urls: Object,
	links: Object,
	createdAt: Date
};

/**
 * An image from Unsplash
 */
class UnsplashImage
{
	/**
	 * @param {UnsplashImageData} data An object holding data for an Unsplash Image
	 */
	constructor(data)
	{
		/**
		 * @type {String}
		 */
		this.color = data.color;

		/**
		 * @type {String}
		 */
		this.description = data.description;

		/**
		 * @type {Object}
		 */
		this.author = data.user;

		/**
		 * @type {Object}
		 */
		this.urls = data.urls;

		/**
		 * @type {Object}
		 */
		this.links = data.links;

		/**
		 * @type {Date}
		 */
		this.createdAt = data.created_at;
	}

	/**
	 * @param  {Object} [defaults={}] Any defaults for the Rich Embed
	 * @return {MessageEmbed} The Rich Embed representing this image
	 */
	embed(defaults = {})
	{
		const embed = new DefaultEmbed(defaults)
			// .setDescription(this.description ? `*${this.description.split("\n").trim()}*` : "")
			// .addField("Attribution", `Photo by [${this.author.name}](${this.author.links.html}) of [Unsplash](https://unsplash.com).`)
			.setImage(this.urls.regular || this.urls.full || this.urls.small)
			.setTimestamp(new Date(this.createdAt));

		if (this.color)
			embed.setColor(this.color);

		embed.author.url = this.links.html;
		return embed;
	}
}

/**
 * A wrapper for the Unsplash API
 */
class Unsplash
{
	/**
	 * [constructor description]
	 * @param {String} [accessKey] An optional Unsplash access key. Retrieved from environment if not specified.
	 */
	constructor(accessKey)
	{
		this.request = request.defaults({
			baseUrl: "https://api.unsplash.com/search/photos",
			json: true,
			qs: {
				per_page: 1000,
				order_by: "relevant"
			},
			headers: {
				"Authorization": `Client-ID ${accessKey || process.env.UNSPLASH_ACCESS_KEY}`
			}
		});

		this.cache = new Cache({
			stdTTL: 60 * 4 // 4 hrs
		});
	}

	/**
	 * Fetches the first 1000 most relevant images for a query.
	 * @param  {String} query The query for the search - can be anything if it exists
	 * @return {Promise<Array>} An array of raw Unsplash Image Objects
	 */
	fetch(query)
	{
		return new Promise((resolve, reject) =>
		{
			if (this.cache.has(query))
				return resolve(this.cache.get(query));

			this.request("/", { qs: { query } }, (err, res, body) =>
			{
				if (err)
					return reject(err);

				this.cache.set(query, body.results);
				resolve(body.results);
			});
		});
	}

	/**
	 * Fetches a random image for a query
	 * @param  {String} query The query for the search - can be anything if it exists
	 * @return {Promise<UnsplashImage>} An UnsplashImage
	 */
	fetchRandom(query)
	{
		return new Promise((resolve, reject) =>
		{
			this.fetch(query)
				.then(album =>
				{
					const img = album.random();
					resolve(new UnsplashImage(img));

					// Trigger /{img}/downloads as per API compliance
					request(img.links.download);
				}).catch(reject);
		});
	}
}

module.exports = Unsplash;
