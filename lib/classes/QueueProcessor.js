const Queue = require("bull");

class QueueProcessor
{
	constructor(client)
	{
		this.client = client;
		this.queue = new Queue("twitch-announce", process.env.REDIS_URL || "redis://127.0.0.1:6379");
		this.queue.process(this.processor.bind(this));
	}

	processor()
	{
		// place processor content into subclass
	}
}

module.exports = QueueProcessor;
