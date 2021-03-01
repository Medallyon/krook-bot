const request = require("request")
	, cheerio = require("cheerio")
	, { InteractionResponseType } = require("discord-interactions")
	, { Command, CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { DefaultEmbed } = require(join(__libdir, "utils"));

const Platform = {
	PC: "pc",
	XBOX_LIVE: "xbl",
	PLAYSTATION_NETWORK: "psn",
	NINTENDO_SWITCH: "nintendo-switch"
};

class PartialProfile
{
	get battletag()
	{
		return `${this.username}#${this.tag}`;
	}

	get stars()
	{
		// 100 levels = 1 star, every 600 levels = remove 1 star
		return Math.floor(this.level / 100) - Math.floor(this.level / 600);
	}

	get url()
	{
		return `https://playoverwatch.com/career/${this.platform}/${this.battletag.replace("#", "-")}`;
	}

	constructor(data)
	{
		const [ match, username, tag ] = data.battletag.match(/^(\w+?)#(\d+)$/);
		this.username = username;
		this.tag = tag;

		this.level = data.level;
		this.public = data.public;
		this.platform = data.platform;
		this.portrait = data.portrait;
	}
}

class Profile extends PartialProfile
{
	constructor(data)
	{
		super(data);

		this.mainHero = data.mainHero;
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
			const data = {};
			// 2 requests are required because the profile html doesn't expose the full player profile
			this.request(`/search/account-by-name/${battletag}`, (err, res, profiles) =>
			{
				if (err)
					return reject(err);

				if (!profiles.length)
					return reject(new Error(`No accounts matching ${battletag}`));

				const profile = profiles[0];
				data.id = profile.id;
				data.battletag = profile.name;
				data.public = profile.isPublic;
				data.platform = profile.platform;
				data.portrait = {
					id: profile.portrait,
					url: null
				};
				data.level = {
					level: profile.level,
					borderImageURL: null
				};

				this.request(`/career/${platform}/${battletag.replace("#", "-")}`, (err, res, body) =>
				{
					if (err)
						return reject(err);

					const $ = cheerio.load(body)
						, grabBackgroundImageURL = (prop) =>
						{
							return prop.match(/^(?:url\s*\(\s*"?)?(.+?)(?:\s*"?\s*\))?$/)[1];
						};

					data.portrait.url = $(".masthead-player > .player-portrait").attr("src");
					data.level.borderImageURL = grabBackgroundImageURL($(".player-level").css("background-image"));
					data.level.starsImageURL = grabBackgroundImageURL($(".player-level > .player-rank").css("background-image"));
					data.endorsement = {
						level: parseInt($(".EndorsementIcon-tooltip > .u-center").first().text().trim())
					};

					if (!data.public)
						return resolve(new PartialProfile(data));

					data.mainHero = {
						name: $(".masthead-hero-image").attr("data-hero-quickplay"),
						imageURL: grabBackgroundImageURL($(".masthead-hero-image").css("background-image").match(/^(?:url\s*\(\s*"?)?(.+?)(?:\s*"?\s*\))?$/)[1])
					};

					resolve(new Profile(data));
				});
			});
		});
	}

	buildEmbed(profile)
	{
		const embed = new DefaultEmbed()
			.setAuthor(profile.username, "https://static.wikia.nocookie.net/overwatch/images/5/53/Pi_defaultblack.png/revision/latest/top-crop/width/220/height/220?cb=20160704195235", profile.url)
			.setThumbnail(profile.portrait.url)
			.setImage(profile.mainHero.imageURL);

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
					resolve(new CommandResponse(this.buildEmbed(profile)));
				}).catch(reject);
		});
	}
}

module.exports = OverwatchProfile;
