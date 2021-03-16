const Discord = require("discord.js");

class Client extends Discord.Client
{
	constructor(options)
	{
		super(options);

		this.utils = require("../utils");
		this.commands = new (require("../commands"))(this);
		this.events = new (require("../events"))(this);

		this.interactions = new (require("./InteractionManager.js"))(this);
		this.crons = new (require("../cron/Manager.js"))(this);
		this.queues = new (require("../queues"))(this);
	}
}

module.exports = Client;
