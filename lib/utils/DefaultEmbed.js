const Discord = require("discord.js")
	, generateRandomColor = require("./generateRandomColor.js");

module.exports = class DefaultEmbed extends Discord.MessageEmbed
{
	constructor(data)
	{
		super(Object.assign({
			type: "rich"
		}, data));

		if (!this.color || (this.color && !this.color.toString().length))
			this.setColor(generateRandomColor());

		if (!this.footer)
			this.setFooter("Powered by the frogs");
	}
};
