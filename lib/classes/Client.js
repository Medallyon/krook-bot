const Discord = require("discord.js");

/* A custom Discord.Client class */
class Client extends Discord.Client
{
	/**
	 * @param {Object} options
	 */
	constructor(options)
	{
		super(options);

		this.utils = require("../utils");
		this.commands = new (require("../commands"))(this);
		this.events = new (require("../events"))(this);

		this.crons = new (require("../cron/Manager.js"))(this);
		this.queues = new (require("../queues"))(this);

		this.interactions = new (require("./InteractionManager.js"))(this);
	}
}

module.exports = Client;
