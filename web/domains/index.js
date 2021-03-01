const fs = require("fs");

let routers = {};
for (const route of fs.readdirSync(__dirname).filter(x => x !== "index.js"))
	routers[route] = require(join(__dirname, route, "index.js"));

module.exports = routers;
