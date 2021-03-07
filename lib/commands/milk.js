const request = require("request")
	, Cache = require("node-cache")
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

class Milk extends Command
{
	constructor(client)
	{
		super(client, 4, {
			name: "milk",
			description: "melk.",
			permission: 100,
		});

		this.request = request.defaults({
			baseUrl: "https://api.unsplash.com/search/photos",
			json: true,
			qs: {
				query: "milk",
				per_page: 1000,
				order_by: "relevant"
			},
			headers: {
				"Authorization": `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
			}
		});

		this.milk = new Cache({
			stdTTL: 60 * 4 // 4 hrs
		});
	}

	fetchRandomMilk()
	{
		return new Promise((resolve, reject) =>
		{
			if (this.milk.has("album"))
				return resolve(this.milk.get("album").random());

			this.request("/", (err, res, body) =>
			{
				if (err)
					return reject(err);

				this.milk.set("album", body.results);

				const img = body.results.random();
				resolve(img);

				// Trigger downloads
				request(img.links.download);
			});
		});
	}

	buildMilkEmbed(milk)
	{
		return new DefaultEmbed({ color: milk.color })
			.setAuthor("Milk", "https://cdn.discordapp.com/emojis/815367496450048073.png", milk.links.html)
			.setDescription(milk.description ? `*${milk.description.trim()}*` : "")
			.addField("Attribution", `Photo by [${milk.user.name}](${milk.user.links.html}) of [Unsplash](https://unsplash.com).`)
			.setImage(milk.urls.regular || milk.urls.full || milk.urls.small)
			.setTimestamp(new Date(milk.created_at));
	}

	run(interaction)
	{
		return new Promise((resolve, reject) =>
		{
			this.fetchRandomMilk()
				.then(milk =>
				{
					resolve(new CommandResponse(this.buildMilkEmbed(milk)));
				}).catch(reject);
		});
	}
}

module.exports = Milk;
