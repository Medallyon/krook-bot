const { Command, CommandResponse } = require("../classes/Command.js");

class Eval extends Command
{
	constructor(client)
	{
		super(client, 4, {
			name: "eval",
			description: "Evaluate a snippet of code. Only Developers may use this command.",
			permission: 900,
		});
	}

	_runFunc(resolve)
	{
		let result;
		try
		{
			result = eval(this.options[0].value);
		}

		catch (err)
		{
			result = err;
		}

		resolve(new CommandResponse("```js\n" + (result || ((typeof result === "undefined") ? "undefined" : "null")) + "```"));
	}

	run(interaction)
	{
		const boundRun = this._runFunc.bind(interaction);
		return new Promise(boundRun);
	}
}

module.exports = Eval;
