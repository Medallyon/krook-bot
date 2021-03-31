const Queue = require("bull");

/**
 * The QueueProcessor defines a processor for a 'bull' Queue. Make sure to override the `processor` method.
 */
class QueueProcessor
{
	/**
	 * @param {Client} client The Discord Client
	 * @param {String} queueName The queue name
	 */
	constructor(client, queueName)
	{
		/**
		 * @type {Client}
		 */
		this.client = client;

		/**
		 * @type {Queue}
		 */
		this.queue = new Queue(queueName, process.env.REDIS_URL || "redis://127.0.0.1:6379");
		this.queue.process(this.processor.bind(this));
		this.queue.on("error", console.error);
	}

	/**
	 * The processor for this queue. Place processor content into a subclass.
	 * @param {Object} job The job
	 * @param {Function} done The callback
	 */
	processor(job, done)
	{
		// place processor content into subclass
	}
}

module.exports = QueueProcessor;
