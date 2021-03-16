require("dotenv").config();

global.join = require("path").join;

global.__basedir = __dirname;
global.__libdir = join(__dirname, "lib");
global.__webdir = join(__dirname, "web");
global.__datadir = join(__dirname, "data");

global.index = function(dir, recursive = Infinity, client = null)
{
	const fs = require("fs")
		, files = fs.readdirSync(dir)
		, modules = {};

	if (recursive instanceof require("discord.js").Client)
	{
		client = recursive;
		recursive = Infinity;
	}

	for (const file of files)
	{
		if (file === "index.js")
			continue;

		const filePath = join(dir, file)
			, stat = fs.statSync(filePath);

		if (stat.isDirectory())
		{ // 'recursive' here stands for the the amount of dirs we should travel and is controlled by decreasing with every directory call
			if (recursive === 0)
				continue;

			modules[file] = global.index(filePath, recursive - 1, client);
			continue;
		}

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
