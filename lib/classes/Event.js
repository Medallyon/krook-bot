const fs = require("fs-extra");

class Event
{
	_installMiddleware()
	{
		const middlewareDirectory = join(__libdir, "events", "middleware", this.name)
			, middleware = [];

		try
		{
			const files = fs.readdirSync(middlewareDirectory);
			for (const file of files)
			{
				try
				{
					middleware.push(require(join(middlewareDirectory, file)));
				}

				catch (err)
				{
					console.error(err);
				}
			}
		}

		catch (err)
		{
			// no middleware defined for this event if "ENOENT"
			if (err.code !== "ENOENT")
				console.error(err);
		}

		return middleware;
	}

	constructor(client, eventName)
	{
		this.ready = false;
		this.on = "on";

		this.client = client;
		this.name = eventName;

		this.middleware = this._installMiddleware;
	}

	trigger(...args)
	{
		if (!this.ready)
			return;

		for (const middle of this.middleware)
			middle(...args);
	}
}

module.exports = Event;
