module.exports = {
	name: 'pokegif',
	aliases: [''],
	description: 'Display the gif of a pokemon',
	guildOnly: false,
	cooldown: 1,
	args: true,
	usage: 'pokegif <pokemon>',
	execute(message, args) {
		const pokemon = args[0].toLowerCase();

		message.channel.send(`${process.env.GIF_URL}/${pokemon}.gif`);
	},
};