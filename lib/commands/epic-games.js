const request = require("request")
	, moment = require("moment")
	, canvas = require("canvas")
	, FAC = require("fast-average-color")
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

class EpicGames extends Command
{
	constructor(client)
	{
		super(client, 4, {
			permission: 100,
			name: "epic-games",
			description: "Get the latest free games on the Epic Games Store!"
		});

		this.dataUri = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=GB&allowCountries=GB";
		this.imageColor = new FAC();
	}

	fetchGames()
	{
		return new Promise((resolve, reject) =>
		{
			request(this.dataUri, { json: true }, (err, res, body) =>
			{
				if (err)
					return reject(err);

				const elements = body["data"]["Catalog"]["searchStore"]["elements"]
					, games = {
						raw: elements,
						thisWeek: elements.filter(g => g.promotions && g.promotions.promotionalOffers.length > 0),
						nextWeek: elements.filter(g => g.promotions && g.promotions.upcomingPromotionalOffers.length > 0)
					};

				resolve(games);
			});
		});
	}

	_getPixelSample(imgURL)
	{
		const getColorIndicesForCoord = (x, y, width) =>
		{
			const red = y * (width * 4) + x * 4;
			return [red, red + 1, red + 2, red + 3];
		};

		return new Promise((resolve, reject) =>
		{
			const cnv = canvas.createCanvas(2560, 1440)
				, ctx = cnv.getContext("2d");

			canvas.loadImage(imgURL).then(img =>
			{
				ctx.drawImage(img, 0, 0);

				const imageData = ctx.getImageData(0, 0, cnv.width, cnv.height);
				let count = 0
					, pixels = [];

				while (count++ < (cnv.width * cnv.height) * .0001)
				{
					const indices = getColorIndicesForCoord(Math.floor(Math.random() * cnv.width), Math.floor(Math.random() * cnv.height), cnv.width)
						, red = imageData.data[indices[0]]
						, green = imageData.data[indices[1]]
						, blue = imageData.data[indices[2]]
						, alpha = imageData.data[indices[3]];

					pixels.push(red, green, blue, alpha);
				}

				resolve(pixels);
			}).catch(reject);
		});
	}

	generateEmbed(games)
	{
		return new Promise(resolve =>
		{
			const thisWeek = games.thisWeek.reverse()
				, endDate = moment(new Date(thisWeek[0]["promotions"]["promotionalOffers"][0]["promotionalOffers"][0].startDate))
				, embed = new DefaultEmbed()
					.setAuthor("This week's free games on Epic", "https://cdn2.unrealengine.com/Fortnite%2Fmobile%2Fandroid-download%2FAPP_Icon-%281%29-332x334-3244057d22ab43e7dd744acfd9eadfa31bdfbcbe.png", "https://www.epicgames.com/store/en-US/free-games")
					.setDescription(`This offer ends ${endDate.tz("Europe/London").format("MMM DD, YYYY HH:SS z")}`);

			const titles = thisWeek.map(g => `**[${g.title}](https://www.epicgames.com/store/en-US/product/${g.productSlug})** ~~(${g.price.totalPrice.fmtPrice.originalPrice})~~`).join("\n• ");
			embed.addField("GAMES", `• ${titles}`, true);

			embed.addField("Next week's free games", `*${games.nextWeek.map(g => g.title).join("*, *")}*`, true);

			const promoImages = thisWeek.filter(g => g.keyImages.length && g.keyImages.some(x => x.type === "DieselStoreFrontWide")).map(g => g.keyImages.find(x => x.type === "DieselStoreFrontWide").url);
			let promoImage = promoImages[Math.floor(Math.random() * promoImages.length)];

			if (!promoImage)
				promoImage = thisWeek[0].keyImages[0].url;
			embed.setImage(encodeURI(promoImage));

			this._getPixelSample(embed.image.url)
				.then(pixels =>
				{
					const color = this.imageColor.getColorFromArray4(pixels, { algorithm: "dominant" });
					embed.setColor(color.slice(0, 3));
				})
				.finally(() =>
				{
					resolve(embed);
				}).catch(console.error);
		});
	}

	run(interaction)
	{
		const args = interaction.arguments;
		if (!args.raw)
			args.raw = { value: false };

		return new Promise((resolve, reject) =>
		{
			this.fetchGames()
				.then(games =>
				{
					if (interaction.arguments.raw.value)
						return resolve(new CommandResponse(`All games listed in the epic document, in the exact order provided:\n*${games.raw.map(g => g.title).join("*, *")}*`));

					this.generateEmbed(games)
						.then(embed =>
						{
							resolve(new CommandResponse(embed));
						}).catch(reject);
				}).catch(reject);
		});
	}
}

module.exports = EpicGames;
