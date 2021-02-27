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

const InteractionResponseType = {
	Pong: 1,
	Acknowledge: 2,
	ChannelMessage: 3,
	ChannelMessageWithSource: 4,
	AcknowledgeWithSource: 5
};

class WebInteractionResponse
{
	constructor(data = {})
	{
		this.type = data.type || InteractionResponseType.Pong;

		/*
		 * tts?					|	boolean				|	is the response TTS
		   content				|	string				|	message content
		   embeds?				|	array of embeds		|	supports up to 10 embeds
		   allowed_mentions?	|	allowed mentions	|	{ allowed mentions } object
		 */
		this.data = data.data;
	}
}

module.exports = { WebInteraction, WebInteractionResponse };
