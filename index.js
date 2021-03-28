require("dotenv").config();

require("./globals.js");

const Client = require("./lib/classes/Client.js");
let client = new Client();

client.login(process.env.DISCORD_BOT_TOKEN)
	.catch(console.error);

let server = require("./web");

module.exports = { client, server };
