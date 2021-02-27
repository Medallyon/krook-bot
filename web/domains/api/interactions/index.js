const router = require("express")()
	, Queue = require("bull")
	, middle = require(join(__webdir, "middleware"))
	, { WebInteraction } = require(join(__webdir, "classes", "WebInteraction.js"));

// Create / Connect to a named work queue
const interactionQueue = new Queue("interactions", process.env.REDIS_URL || "redis://127.0.0.1:6379");

router.use(middle.interactions.securityAuthorization);

router.post("/", function(req, res)
{
	console.log(req.body);

	if (req.body == null)
		return res.sendStatus(400);

	// ACKnowledge PING payload
	if (req.body.type === 1)
		return res.json({ type: 1 });

	// res.status(200).end();

	// pass interaction to redis queue, which passes it to the client
	// where it processes AND responds to the webhook using the Interaction's 'token'
	interactionQueue.add(new WebInteraction(req.body))
		.catch(console.error);
});

module.exports = router;

// You can listen to global events to get notified when jobs are processed
interactionQueue.on("global:completed", (id, result) =>
{
	console.log(`Job {${id}} completed with result ${result}`);
});

interactionQueue.on("global:error", console.error);
interactionQueue.on("global:failed", console.error);
