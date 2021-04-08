class Events
{
	constructor(client)
	{
		const custom = global.index(join(__dirname, "custom"), 1, client);
		for (const [ key, mod ] of Object.entries(custom))
			this[key] = mod;

		const modules = global.index(__dirname, 0, client);
		for (const [ key, mod ] of Object.entries(modules))
			this[key] = mod;

		for (const event in this)
			client[this[event].on](event, this[event].trigger.bind(this[event]));
	}
}

module.exports = Events;
