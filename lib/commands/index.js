class Commands
{
	constructor(client)
	{
		const modules = global.index(__dirname, 0, client);
		for (const cmd of Object.values(modules))
			this[cmd.name] = cmd;
	}
}

module.exports = Commands;
