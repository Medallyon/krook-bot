const request = require("request")
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

class Frog extends Command
{
	constructor(client)
	{
		super(client, 4, {
			name: "frog",
			description: "it's funni overwatch frog-man!!",
			permission: 100,
		});

		this.request = request.defaults({
			baseUrl: "https://api.unsplash.com/photos/random",
			json: true,
			qs: {
				query: "frog"
			},
			headers: {
				"Authorization": `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
			}
		});
	}

	fetchRandomFrog()
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

	buildFrogEmbed(frog)
	{
		return new DefaultEmbed({ color: frog.color })
			.setAuthor("Frog", "https://cdn.discordapp.com/emojis/538077367231578177.png", frog.links.html)
			.setDescription(`*${frog.description || "There should be a frog somewhere in this image."}*`)
			.addField("Attribution", `Photo by [${frog.user.name}](${frog.user.links.html}) of [Unsplash](https://unsplash.com).`)
			.setImage(frog.urls.regular || frog.urls.full || frog.urls.small)
			.setTimestamp(new Date(frog.created_at));
	}

	run(interaction)
	{
		return new Promise((resolve, reject) =>
		{
			this.fetchRandomFrog()
				.then(frog =>
				{
					resolve(new CommandResponse(this.buildFrogEmbed(frog)));
				}).catch(reject);
		});
	}
}

module.exports = Frog;
