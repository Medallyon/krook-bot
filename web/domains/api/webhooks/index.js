const router = require("express").Router()
	, Cache = require("node-cache");

router.get("/", function(req, res)
{
	res.sendStatus(200);
});

const twitchIDs = new Cache({
	stdTTL: 60
});

router.post("/", async function(req, res)
{
	if (twitchIDs.has(req.get("Twitch-Eventsub-Message-Id")))
		return res.sendStatus(204);
	twitchIDs.set(req.get("Twitch-Eventsub-Message-Id"));

	if (req.body && req.body.challenge)
		return res.send(req.body.challenge);
	else
		res.sendStatus(200);

	const event = req.body.event
		, { client } = require(join(__basedir, "index.js"));
	await client.twitch.init();

	client.twitch.users.fetch(event.broadcaster_user_id)
		.then(streamer =>
		{
			client.twitch.streams.fetch(event.broadcaster_user_id)
				.then(stream =>
				{
					client.emit("twitch-live", { event, streamer, stream });
				}).catch(console.error);
		}).catch(console.error);
});

module.exports = router;
