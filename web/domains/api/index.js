const router = require("express")()
	, fs = require("fs");

for (const route of fs.readdirSync(__dirname).filter(x => x !== "index.js"))
	router.use(`/${route}`, require(join(__dirname, route, "index.js")));

module.exports = router;
