const router = require("express").Router()
	, Queue = require("bull")
	, twitch = new (require(join(__webdir, "classes", "Twitch.js")))();

const announceQueue = new Queue("twitch-announce", process.env.REDIS_TLS_URL || process.env.REDIS_URL || "redis://127.0.0.1:6379");

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

	await twitch.init();

	const event = req.body.event;
	twitch.users.fetch(event.broadcaster_user_id)
		.then(streamer =>
		{
			twitch.streams.fetch(event.broadcaster_user_id)
				.then(stream =>
				{
					announceQueue.add({ event, streamer, stream });
				}).catch(console.error);
		}).catch(console.error);
});

module.exports = router;
