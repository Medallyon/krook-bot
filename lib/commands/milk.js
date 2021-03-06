const request = require("request")
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
			baseUrl: "https://api.unsplash.com/photos/random",
			json: true,
			qs: {
				query: "milk"
			},
			headers: {
				"Authorization": `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
			}
		});
	}

	fetchRandomMilk()
	{
		return new Promise((resolve, reject) =>
		{
			this.request("/", (err, res, body) =>
			{
				if (err)
					return reject(err);
				resolve(body);

				// Trigger downloads
				request(body.links.download);
			});
		});
	}

	buildMilkEmbed(milk)
	{
		return new DefaultEmbed({ color: milk.color })
			.setAuthor("Milk", "https://cdn.discordapp.com/emojis/815367496450048073.png", milk.links.html)
			.setDescription(`*${milk.description || "There should be milk somewhere in this image."}*`)
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
