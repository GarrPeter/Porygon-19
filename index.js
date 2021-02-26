const Discord = require('discord.js');
const fs = require('fs')
const dotenv = require('dotenv');

dotenv.config();

// boilerplate the discord client and set up collections/commands
const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

const prefix = '!'

for (const folder of commandFolders) {
	// looks at all the files in the folder and adds all the JavaScript files to an array
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		// set a new item in the Collection
		// with the key as the command name and the value as the exported module
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {

	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	// checks registered commands and then command aliases to see if the command exists
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	// check if a user has exceeded a commands cool-down and sets that user-command cooldown
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		if (command.guildOnly && message.channel.type === 'dm') {
			return message.reply('I can\'t execute that command inside DMs!');
		}
		if(command.args && !args.length) {
			let reply = `You didn't provide any arguments, ${message.author}!`;
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}
			return message.channel.send(reply);
		}
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(process.env.BOT_TOKEN);