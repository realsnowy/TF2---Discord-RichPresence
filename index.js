if (process.platform !== 'win32') throw Error('This ONLY works on Windows');

const DiscordRPC = require('discord-rpc');
const request = require('request');
const child_process = require('child_process');
const fs = require('fs');
const config = require('./config.json');

var client = new DiscordRPC.Client({ transport: 'ipc' });
client.login({ clientId: config.clientId }).catch(console.error);

var availableMapIcons = [];
var updateAllowed = false;
var backupData = {};
var queuedChanges = undefined;
var firstStart = undefined;
var isClientCreated = false;
var logPath = undefined;
var gamePath = undefined;

setInterval(() => {
	child_process.exec('WMIC path win32_process get Caption,Processid,Commandline', { windowsHide: true, maxBuffer: (1024 * 1000) }, (error, stdout, stderr) => {
		if (error) return console.error(error);

		var foundTF2 = false;
		var fullProcessList = stdout.split('\n');
		for (let i in fullProcessList) {
			var split = fullProcessList[i].split(/    ( +)/); // Split by everything that has at least 5 spaces
			for (let i = 0; i < split.length; i++) {
				if (!split[i]) continue;

				if (/    ( +)/.test(split[i]) || /\r/.test(split[i])) {
					split.splice(i, 1);
					i--;
				}
			}
			split.pop();

			if (!split[0] || !split[1]) continue;

			if (split[0].toLowerCase() === 'hl2.exe' && /-game( +)tf/i.test(split[1])) { // TF2!
				foundTF2 = true;

				var pathMatch = split[1].match(/(["'])(?:(?=(\\?))\2.)*?\1/);
				if (pathMatch && pathMatch.length > 1) {
					var exePath = pathMatch[0].replace(/(^")|("$)/g, '');
					var splitPath = exePath.split('\\');
					splitPath.pop();
					gamePath = splitPath.join('/') + '/tf/';
					logPath = splitPath.join('/') + '/tf/discordrichpresence.log';
				}
			}
		}

		if (!foundTF2 && isClientCreated) {
			client.destroy();
			isClientCreated = false;
		} else if (foundTF2 && !isClientCreated) {
			client = new DiscordRPC.Client({ transport: 'ipc' });
			client.login({ clientId: config.clientId }).catch(console.error);

			availableMapIcons = [];
			updateAllowed = false;
			backupData = {};
			queuedChanges = undefined;
			firstStart = undefined;
			isClientCreated = true;

			getReady(client);
		}
	});
}, 1 * 1000); // Check if hl2.exe (with "-game tf" parameter) is running or not

function getReady(RPC) {
	if (config.configs.generateConfigs) {
		// Create the configs to make this all work
		if (typeof gamePath === 'string' && fs.existsSync(gamePath + 'cfg/')) {
			// Maps
			var mapList = fs.readdirSync(gamePath + 'maps/');
			for (let i = 0; i < mapList.length; i++) {
				if (!mapList[i]) continue;

				if (!mapList[i].endsWith('.bsp')) {
					mapList.splice(i, 1);
					i--;
				}

				mapList[i] = mapList[i].replace(/.bsp$/, '');
			}

			for (let i in mapList) {
				if (config.configs.tuscanExisting && fs.existsSync(gamePath + 'cfg/' + mapList[i].toLowerCase() + '.cfg')) {
					var content = fs.readFileSync(gamePath + 'cfg/' + mapList[i].toLowerCase() + '.cfg').toString();
					if (content.includes('echo RICH_PRESENCE_LOAD_MAP ' + mapList[i].toLowerCase() + '\n')) continue;
					fs.appendFileSync(gamePath + 'cfg/' + mapList[i].toLowerCase() + '.cfg', '\necho RICH_PRESENCE_LOAD_MAP ' + mapList[i].toLowerCase() + '\n');
				} else {
					fs.writeFileSync(gamePath + 'cfg/' + mapList[i].toLowerCase() + '.cfg', 'echo RICH_PRESENCE_LOAD_MAP ' + mapList[i].toLowerCase() + '\n');
				}
			}

			// Classes
			var classes = [ 'scout', 'soldier', 'pyro', 'demoman', 'heavyweapons', 'engineer', 'medic', 'sniper', 'spy' ];
			var configs = fs.readdirSync(gamePath + 'cfg/');

			for (let i in classes) {
				var fileExists = false;
				for (let x in configs) {
					if (new RegExp('^' + classes[i].toLowerCase() + '.cfg$').test(configs[x].toLowerCase())) {
						fileExists = true;
					}
				}

				if (fileExists) {
					var content = fs.readFileSync(gamePath + 'cfg/' + classes[i] + '.cfg').toString();
					if (content.includes('echo RICH_PRESENCE_LOAD_CLASS ' + classes[i].toLowerCase() + '\n')) continue;
					fs.appendFileSync(gamePath + 'cfg/' + classes[i].toLowerCase() + '.cfg', '\necho RICH_PRESENCE_LOAD_CLASS ' + classes[i].toLowerCase() + '\n');
				} else {
					fs.writeFileSync(gamePath + 'cfg/' + classes[i].toLowerCase() + '.cfg', 'echo RICH_PRESENCE_LOAD_CLASS ' + classes[i].toLowerCase() + '\n');
				}
			}
		}
	}

	RPC.on('ready', () => {
		// Get rich presence assets
		request('https://discordapp.com/api/oauth2/applications/' + config.clientId + '/assets', (err, res, body) => {
			if (err) return console.error(err);

			var json = undefined;
			try {
				json = JSON.parse(body);
			} catch(err) {};

			if (!json || !json[0] || !json[0].name) return;
	
			availableMapIcons = [];
			for (let i = 0; i < json.length; i++) {
				if (/^(ctf_|cp_|tc_|pl_|arena_|koth_|tr_|sd_|mvm_|rd_|ctf_|pass_|pd_)/.test(json[i].name)) {
					availableMapIcons.push(json[i].name);
				}
			}

			updateAllowed = true;
			updatePresence(RPC, 'settingup');
		});
	});
}

function updatePresence(RPC, data) {
	if (!RPC) {
		updateAllowed = false;
		queuedChanges = undefined;
		return;
	}

	if (!data || (typeof data === 'string' && data === 'settingup')) {
		firstStart = parseInt(new Date().getTime() / 1000);

		RPC.setActivity({
			details: 'Main Menu',
			largeImageKey: 'menu',
			startTimestamp: parseInt(new Date().getTime() / 1000)
		}).catch(() => {});
		return;
	}

	if (!data || !data.rawMap || !data.map || !data.mode || !data.class || !data.onServer) {
		if (data.rawMap) backupData.rawMap = data.rawMap;
		if (data.map) backupData.map = data.map;
		if (data.mode) backupData.mode = data.mode;
		if (data.class) backupData.class = data.class;
		if (data.onServer) backupData.onServer = data.onServer;

		data = backupData;

		if (!data || !data.rawMap || !data.map || !data.mode || !data.class || !data.onServer) {
			return;
		}
	}

	if (!updateAllowed) {
		queuedChanges = data;
		return;
	}
	updateAllowed = false;

	setTimeout(() => {
		updateAllowed = true;

		if (queuedChanges) updatePresence(RPC, queuedChanges);
	}, 15000);

	queuedChanges = undefined;

	if (data.onServer === 'yes') {
		RPC.setActivity({
			state: 'Playing ' + data.class.slice(0, 1).toUpperCase() + data.class.slice(1),
			details: 'Playing on ' + data.map.slice(0, 1).toUpperCase() + data.map.slice(1),
			startTimestamp: parseInt(firstStart),
			largeImageKey: (availableMapIcons.includes(data.rawMap) ? data.rawMap : 'default'),
			largeImageText: data.rawMap,
			smallImageKey: data.class,
			smallImageText: data.class.slice(0, 1).toUpperCase() + data.class.slice(1),
			startTimestamp: firstStart
		}).catch(() => {});
	}
	return;
}

// Read logs
setInterval(() => {
	if (!isClientCreated) return;

	if (!fs.existsSync(logPath)) {
		return;
	}

	var rawData = fs.readFileSync(logPath).toString().split('\n');
	fs.writeFileSync(logPath, '');

	if (!rawData || rawData.length < 1) return;

	for (let i in rawData) rawData[i] = rawData[i].replace(/\r$/, '');

	var data = {
		rawMap: undefined,
		mode: undefined,
		map: undefined,
		class: undefined,
		onServer: undefined
	}

	for (let i = 0; i < rawData.length; i++) {
		if (!rawData[i] || rawData[i].length < 1) continue;

		if (rawData[i].startsWith('RICH_PRESENCE_LOAD_MAP')) {
			var map = rawData[i].split(' ');
			map.shift();

			data.rawMap = map.join(' ');
			data.mode = map.join(' ').split('_').shift();
			data.map = data.rawMap.replace(data.mode, '');
			if (data.map.startsWith('_')) data.map = data.map.replace('_', '');
		} else if (rawData[i].startsWith('Map: ')) { // Incase of a map we dont have a config file for. Not very reliable
			var map = rawData[i].split(' ');
			map.shift();

			data.rawMap = map.join(' ');
			data.mode = map.join(' ').split('_').shift();
			data.map = data.rawMap.replace(data.mode, '');
			if (data.map.startsWith('_')) data.map = data.map.replace('_', '');
		} else if (rawData[i].startsWith('RICH_PRESENCE_LOAD_CLASS')) {
			var class_ = rawData[i].split(' ');
			class_.shift();

			data.class = class_.join(' ').replace(/ /g, '');
		} else if (rawData[i] === 'Client reached server_spawn.') {
			data.onServer = 'yes';
		} else if (/SoundEmitter:( +)removing map sound overrides \[(\d+) to remove, (\d+) to restore\]/.test(rawData[i]) || rawData[i] === 'Disconnect: #TF_Competitive_Disconnect.' || rawData[i] === 'The match is over. Thanks for playing!') {
			data.onServer = 'no';

			client.setActivity({
				details: 'Main Menu',
				largeImageKey: 'menu',
				startTimestamp: firstStart
			}).catch(() => {});
		}
	}

	updatePresence(client, data);
}, 1000);
