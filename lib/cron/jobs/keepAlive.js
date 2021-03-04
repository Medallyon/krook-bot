const CronJob = require("cron").CronJob
	, request = require("request");

class KeepAlive
{
	constructor(manager)
	{
		this.manager = manager;

		this.cron = new CronJob({
			// run every 30 mins
			cronTime: "0 */30 * * * *",
			onTick: this.job,
			context: this,
			start: true,
			// don't run on init because client might not be ready yet
			runOnInit: false
		});
	}

	job()
	{
		return request("https://krook-bot.herokuapp.com/");
	}
}

module.exports = KeepAlive;
