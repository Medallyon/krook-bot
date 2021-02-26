const nacl = require("tweetnacl");

module.exports = function(req, res, next)
{
	const signature = {
		id: req.get("X-Signature-Ed25519"),
		timestamp: req.get("X-Signature-Timestamp")
	};

	console.log(signature);
	console.log(req.body);

	const isVerified = nacl.sign.detached.verify(
		Buffer.from(signature.timestamp + req.body),
		Buffer.from(signature.id, "hex"),
		Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
	);

	console.log(isVerified);

	if (!isVerified)
		return res.status(401).end("invalid request signature");

	next();
};
