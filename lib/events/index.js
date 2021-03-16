class Events
{
	constructor(client)
	{
		const modules = global.index(__dirname, 1, client);
		for (const [ key, mod ] of Object.entries(modules))
			this[key] = mod;

		for (const event in this)
		{
			if (event === "middleware")
				continue;
			client[this[event].on](event, this[event].trigger.bind(this[event]));
		}
	}
}

module.exports = Events;
