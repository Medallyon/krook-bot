class Environment
{
	splitValues(parsed, sep)
	{
		for (const [ key, value ] of Object.entries(parsed))
		{
			if ((typeof sep) === "string" && value.includes(sep)
				|| sep instanceof RegExp && sep.test(value))
				parsed[key] = value.split(sep);
		}

		return parsed;
	}

	constructor(parsed = {}, splitSep = null)
	{
		parsed = (splitSep != null && this.splitValues(parsed, splitSep)) || parsed;
		for (const [ key, value ] of Object.entries(Object.assign({}, process.env, parsed)))
			Object.defineProperty(this, key, {
				value,
				enumerable: true,
				writable: true
			});
	}

	valueOf()
	{
		const value = {};
		for (const [ key, val ] of Object.entries(this))
			value[key] = val;
		return value;
	}
}

process.env = new Environment(require("dotenv").config().parsed || {}, /[\s,]/);

global.join = require("path").join;

global.__basedir = __dirname;
global.__libdir = join(__dirname, "lib");
global.__webdir = join(__dirname, "web");
global.__datadir = join(__dirname, "data");

global.index = function(dir, client = null)
{
	const fs = require("fs");

	let modules = {}
		, files = fs.readdirSync(dir);

	for (const file of files)
	{
		const stat = fs.statSync(join(dir, file));
		if (stat.isDirectory() || file === "index.js")
			continue;

		const filePath = join(dir, file);
		if (client != null)
			modules[file.replace(".js", "")] = new (require(filePath))(client);
		else
			modules[file.replace(".js", "")] = require(filePath);
	}

	return modules;
};

Array.prototype.first = function()
{
	return this[0];
};
Array.prototype.last = function()
{
	return this[this.length - 1];
};
Array.prototype.shuffle = function()
{
	// https://stackoverflow.com/a/12646864
	for (let i = this.length - 1; i > 0; i--)
	{
		const j = Math.floor(Math.random() * (i + 1));
		[this[i], this[j]] = [this[j], this[i]];
	}

	return this;
};
Array.prototype.random = function()
{
	return this[Math.floor(Math.random() * this.length)];
};
