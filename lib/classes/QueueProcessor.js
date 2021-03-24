const Queue = require("bull");

class QueueProcessor
{
	constructor(client, queueName)
	{
		this.client = client;

		this.queue = new Queue(queueName, process.env.REDIS_URL || "redis://127.0.0.1:6379");
		this.queue.process(this.processor.bind(this));
	}

	processor()
	{
		// place processor content into subclass
	}
}

module.exports = QueueProcessor;
