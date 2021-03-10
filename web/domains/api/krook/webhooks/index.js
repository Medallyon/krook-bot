const router = require("express").Router()
	, Queue = require("bull")
	, twitch = new (require(join(__webdir, "classes", "Twitch.js")))();

const announceQueue = new Queue("twitch_announce", process.env.REDIS_URL || "redis://127.0.0.1:6379");

router.get("/", function(req, res)
{
	res.sendStatus(200);
});

const twitchIDs = [];
router.post("/", async function(req, res)
{
	if (twitchIDs.includes(req.get("Twitch-Eventsub-Message-Id")))
		return res.sendStatus(204);

	if (req.body && req.body.challenge)
		return res.send(req.body.challenge);
	else
		res.sendStatus(200);

	const event = req.body.event;
	await twitch.init();

	announceQueue.add({ event });
	/*twitch.users.fetch({ id: event.broadcaster_user_id })
		.then(streamer =>
		{
			announceQueue.add({ event, streamer });
		}).catch(console.error);*/
});

module.exports = router;
