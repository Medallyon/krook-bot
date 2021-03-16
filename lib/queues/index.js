class Queues
{
	constructor(client)
	{
		const modules = global.index(__dirname, client);
		for (const [ key, mod ] of Object.entries(modules))
			this[key] = mod;
	}
}

module.exports = Queues;
