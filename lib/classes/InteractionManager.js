const request = require("request")
	, DI = require("better-discord-interactions")
	, isEqual = require("lodash.isequal")
	, { ClientInteraction, WebInteractionResponse } = require(join(__libdir, "classes", "Interactions.js"))
	, { CommandResponse } = require(join(__libdir, "classes", "Command.js"))
	, { determinePermissions } = require(join(__libdir, "utils"));

class ApplicationCommands
{
	static from(command)
	{
		const cmd = {
			name: command.name.toLowerCase(),
			description: command.description
		};

		if (Array.isArray(command.options))
			cmd.options = command.options.map(o => Object.assign(o, { name: o.name.toLowerCase() }));

		return cmd;
	}

	constructor(client)
	{
		this.client = client;
		this.commands = this.client.api.applications(process.env.DISCORD_CLIENT_ID).commands;
	}

	fetch(id = undefined)
	{
		return this.commands.get(id);
	}

	create(data)
	{
		return this.commands.post({ data });
	}

	update(id, data)
	{ // currently returns '405 not allowed' for some reason
		// return this.commands(id).patch({ data });
		return this.commands.post({ data });
	}

	delete(id)
	{
		return this.commands(id).delete();
	}
}

/**
 * This class describes the interaction manager for Discord.
 */
class InteractionManager
{
	_validate()
	{
		this.commandMgr.fetch()
			.then(existing =>
			{
				for (const cmd of Object.values(this.client.commands))
				{
					if (cmd.system || cmd.permission >= 900)
						continue;

					const command = Object.values(existing).find(c => c.name === cmd.name);
					if (!command)
					{
						console.log(`cmd {${cmd.name}} doesn't exist. Creating..`);
						this.commandMgr.create(ApplicationCommands.from(cmd))
							.catch(err =>
							{
								console.warn(`Could not create the {${cmd.name}} command: ${err}`);
							});
						continue;
					}

					if (!isEqual(ApplicationCommands.from(command), ApplicationCommands.from(cmd)))
					{
						console.log(`cmd {${cmd.name}} is different. Updating..`);
						this.commandMgr.update(command.id, ApplicationCommands.from(cmd))
							.catch(err =>
							{
								console.warn(`Could not update the {${cmd.name}} command: ${err}`);
							});
					}
				}

				const unusedCommands = existing.filter(c => !Object.keys(this.client.commands).includes(c.name));
				for (const command of unusedCommands)
					this.commandMgr.delete(command.id)
						.catch(err =>
						{
							console.warn(`Could not delete the {${command.name}} command: ${err}`);
						});
			}).catch(console.error);
	}

	constructor(client)
	{
		this.client = client;
		this.commandMgr = new ApplicationCommands(this.client);

		this.respond = request.defaults({
			method: "POST",
			baseUrl: "https://discord.com/api/v8/interactions",
			json: true,
			headers: {
				"Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
			}
		});

		// validate commands
		this._validate();

		// create event listener for interactions
		// will most likely move to built-in Client.events in time
		this.client.ws.on("INTERACTION_CREATE", this._create.bind(this));
	}

	async _create(interaction)
	{
		const cInteraction = new ClientInteraction(this.client, interaction);
		await cInteraction.init();

		let cmd = Object.values(this.client.commands).find(c => c.name === cInteraction.command.name);
		if (cmd == null)
			throw new Error(`Command '${cInteraction.command.name}' does not exist`);

		if (determinePermissions(cInteraction.member || cInteraction.user) < cmd.permission)
			this.respond(`${cInteraction.id}/${cInteraction.token}/callback`, {
				body: new WebInteractionResponse(DI.InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, new CommandResponse(cInteraction._generateErrorEmbed("You do not have permission to call this command.")))
			});

		this.respond(`${cInteraction.id}/${cInteraction.token}/callback`, {
			body: new WebInteractionResponse(DI.InteractionResponseType.ACKNOWLEDGE_WITH_SOURCE)
		}, err =>
		{
			if (err)
				console.error(err);

			let cmdResponse;
			try
			{
				cmdResponse = cmd.run(cInteraction);
			}

			catch (err)
			{
				console.error(err);
				cmdResponse = err;
			}

			if (cmdResponse instanceof Promise)
				return cmdResponse.then(cInteraction.respond.bind(cInteraction))
					.catch(cInteraction.respond.bind(cInteraction));
			else
				cInteraction.respond(cmdResponse);
		});
	}
}

module.exports = InteractionManager;
