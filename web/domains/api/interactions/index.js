const router = require("express")()
	, Queue = require("bull")
	, middle = require(join(__webdir, "middleware"))
	, { WebInteraction } = require(join(__webdir, "classes", "WebInteraction.js"));

// Create / Connect to a named work queue
const workQueue = new Queue("interactions", process.env.REDIS_URL || "redis://127.0.0.1:6379");

router.use(middle.interactions.securityAuthorization);

router.post("/", function(req, res)
{
	console.log(req.body);

	if (req.body == null)
		return res.sendStatus(400);

	// ACKnowledge PING payload
	if (req.body.type === 1)
		return res.json({ type: 1 });

	/*{
		"type": 2,
		"token": "A_UNIQUE_TOKEN",
		"member": {
			"user": {
				"id": 53908232506183680,
				"username": "Mason",
				"avatar": "a_d5efa99b3eeaa7dd43acca82f5692432",
				"discriminator": "1337",
				"public_flags": 131141
			},
			"roles": ["539082325061836999"],
			"premium_since": null,
			"permissions": "2147483647",
			"pending": false,
			"nick": null,
			"mute": false,
			"joined_at": "2017-03-13T19:19:14.040000+00:00",
			"is_pending": false,
			"deaf": false
		},
		"id": "786008729715212338",
		"guild_id": "290926798626357999",
		"data": {
			"options": [{
				"name": "cardname",
				"value": "The Gitrog Monster"
			}],
			"name": "cardsearch",
			"id": "771825006014889984"
		},
		"channel_id": "645027906669510667"
	}*/

	const interaction = new WebInteraction(req.body);
	console.log("Created new WebInteraction:", interaction);

	// pass interaction to redis queue, which passes it to the client
	// where it processes AND responds to the webhook using the Interaction's 'token'
	workQueue.add(interaction)
		.catch(console.error);

	res.status(200).json({
		type: 4,
		data: {
			content: "Give me a second..."
		}
	});
});

module.exports = router;

// You can listen to global events to get notified when jobs are processed
workQueue.on("global:completed", (id, result) =>
{
	console.log(`Job {${id}} completed with result ${result}`);
});

workQueue.on("global:error", console.error);
workQueue.on("global:failed", console.error);
