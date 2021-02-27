class WebInteraction
{
	constructor(payload)
	{
		this.id = payload.id;
		this.token = payload.token;
		this.type = payload.type;
		this.data = payload.data;
		this.options = payload.data.options || [];
		this.guildID = payload.guild_id;
		this.channelID = payload.channel_id;
		this.member = payload.member;
		this.version = payload.version;
	}
}

class WebInteractionResponse
{
	constructor(type, cmdResponse)
	{
		this.type = type;

		/*
		 * tts?					|	boolean				|	is the response TTS
		   content				|	string				|	message content
		   embeds?				|	array of embeds		|	supports up to 10 embeds
		   allowed_mentions?	|	allowed mentions	|	{ allowed mentions } object
		 */
		this.data = cmdResponse;
	}
}

module.exports = { WebInteraction, WebInteractionResponse };
