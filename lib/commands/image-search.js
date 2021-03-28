const Unsplash = require(join(__libdir, "classes", "Unsplash.js"))
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"));

/**
 * This command allows you to fetch a random image from Unsplash based on a category
 * @extends Command
 */
class ImageSearch extends Command
{
	constructor(client)
	{
		super(client, 4, {
			permission: 100,
			name: "image-search",
			description: "Get a random image from a given category",
			options: [
				{
					type: 3,
					name: "category",
					description: "The category for this image search",
					required: true,
					choices: [
						{
							"name": "frogg",
							"value": "frog"
						},
						{
							"name": "milky",
							"value": "milk"
						},
						{
							"name": "mm monke",
							"value": "monkey"
						}
					]
				}
			]
		});

		/**
		 * An Unsplash Wrapper
		 * @type {Unsplash}
		 */
		this.api = new Unsplash();
		this._embedDefaults = {
			frog: {
				author: {
					name: "frogg",
					icon_url: "https://cdn.discordapp.com/emojis/538077367231578177.png?v=1"
				}
			},
			milk: {
				author: {
					name: "milky",
					icon_url: "https://cdn.discordapp.com/emojis/815367496450048073.png?v=1"
				}
			},
			monkey: {
				author: {
					name: "monke",
					icon_url: "https://pics.me.me/thumb_tvperu-taarc-twitch-52546667.png"
				}
			}
		};
	}

	/**
	 * @param  {Interaction} interaction The interaction in question
	 * @return {Promise<CommandResponse>}
	 */
	run(interaction)
	{
		const args = interaction.arguments;
		return new Promise((resolve, reject) =>
		{
			this.api.fetchRandom(args.category.value)
				.then(img =>
				{
					resolve(new CommandResponse(img.embed(this._embedDefaults[args.category.value])));
				}).catch(reject);
		});
	}
}

module.exports = ImageSearch;
