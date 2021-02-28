const request = require("request")
	, cheerio = require("cheerio")
	, { InteractionResponseType } = require("discord-interactions")
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

/*[{
  "name": "Medallyon#21381",
  "urlName": "Medallyon-21381",
  "id": 406193473,
  "level": 768,
  "playerLevel": 768,
  "isPublic": true,
  "platform": "pc",
  "portrait": "0x0250000000000C77"
}]*/

const Platform = {
	PC: "pc",
	XBOX_LIVE: "xbl",
	PLAYSTATION_NETWORK: "psn",
	NINTENDO_SWITCH: "nintendo-switch"
};

class Profile
{
	get battletag()
	{
		return `${this.username}#${this.tag}`;
	}

	get stars()
	{
		return Math.floor(this.level / 100);
	}

	get portraitURL()
	{
		return `https://d1u1mce87gyfbn.cloudfront.net/game/unlocks/${this.portrait}.png`;
	}

	get url()
	{
		return `https://playoverwatch.com/career/${this.platform}/${this.urlName}`;
	}

	constructor(data)
	{
		this.id = data.id;

		const [ match, username, tag ] = data.name.match(/^(\w+?)#(\d+)$/);
		this.username = username;
		this.tag = tag;
		this.urlName = data.urlName;

		this.level = data.level;
		this.public = data.isPublic;
		this.platform = data.platform;
		this.portrait = data.portrait;
	}
}

class OverwatchProfile extends Command
{
	constructor(client)
	{
		super(client, InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
			name: "overwatch-profile",
			description: "Display an Overwatch Profile. Profile must be set to public.",
			permission: 100
		});

		this.request = request.defaults({
			baseUrl: "https://playoverwatch.com",
			json: true,
			headers: {
				"User-Agent": "krook-bot (https://github.com/medallyon/krook-bot)"
			}
		});
	}

	fetchProfile(battletag, platform = Platform.PC)
	{
		// TODO: persist profiles with 'node-cache'
		return new Promise((resolve, reject) =>
		{
			this.request(`/search/account-by-name/${battletag}`, (err, res, profiles) =>
			{
				if (err)
					return reject(err);

				profiles = profiles.filter(p => p.platform === platform);
				if (!profiles.length)
					return reject(new Error(`No accounts matching ${battletag}`));

				resolve(new Profile(profiles[0]));
			});
		});
	}

	fetchStats(battletag, platform = "pc")
	{
		// TODO: implement
		return Promise.resolve({});
	}

	buildEmbed(profile)
	{
		const embed = new DefaultEmbed()
			.setAuthor(profile.username, "https://static.wikia.nocookie.net/overwatch/images/5/53/Pi_defaultblack.png/revision/latest/top-crop/width/220/height/220?cb=20160704195235", profile.url)
			.setThumbnail(profile.portraitURL);
			// .setImage(profile.prominentHero.imageURL);

		// TODO: add some info fields

		return embed;
	}

	run(interaction)
	{
		if (!/\w{4,32}#\d{4,5}/.test(interaction.options.battletag.value))
			return Promise.reject(new Error("'battletag' must be valid."));

		if (!interaction.options.platform)
			interaction.options.platform = { value: "pc" };

		return new Promise((resolve, reject) =>
		{
			this.fetchProfile(interaction.options.battletag.value, interaction.options.platform.value)
				.then(profile =>
				{
					console.log(profile);
					this.fetchStats(interaction.options.battletag.value, interaction.options.platform.value)
						.then(stats =>
						{
							// profile.stats = stats.stats;
							resolve(new CommandResponse(this.buildEmbed(profile)));
						}).catch(reject);
				}).catch(reject);
		});
	}
}

module.exports = OverwatchProfile;
