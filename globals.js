require("dotenv").config();

global.join = require("path").join;

/**
 * Path to the base directory (usually equivalent to cwd)
 * @type {String}
 */
global.__basedir = __dirname;
/**
 * Path to the library directory
 * @type {String}
 */
global.__libdir = join(__dirname, "lib");
/**
 * Path to the web directory
 * @type {String}
 */
global.__webdir = join(__dirname, "web");
/**
 * Path to the Data directory
 * @type {String}
 */
global.__datadir = join(__dirname, "data");

/**
 * Synchronously iterate through modules in a directory and require them
 * @param  {String} dir The target module directory
 * @param  {Number} [recursive=Infinity] The depth of the index, recurse into directories
 * @param  {Client} [client=null] An optional Discord client to pass into classes
 * @return {Object} An object of the aggregated modules
 */
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

/**
 * Return the first element of this array
 * @return {*}
 */
Array.prototype.first = function()
{
	return this[0];
};
/**
 * Return the last element of this array
 * @return {*}
 */
Array.prototype.last = function()
{
	return this[this.length - 1];
};
/**
 * Shuffle this array, Durstenfeld-style
 * @return {Array} This array
 */
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
/**
 * Pick a random value from this array
 * @return {*}
 */
Array.prototype.random = function()
{
	return this[Math.floor(Math.random() * this.length)];
};
