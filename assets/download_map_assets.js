const request = require('request');
const sharp = require('sharp');
const fs = require('fs');

const maps = JSON.parse(fs.readFileSync('./map_assets.json'));

var finishedFiles = 0;
for (let i in maps) {
	request(maps[i].link).pipe(fs.createWriteStream('./maps/' + maps[i].rawName + '.png').on('close', () => {
		console.log('Saved ' + maps[i].name);
		finishedFiles++;
	}));
}

var check = setInterval(() => {
	if (finishedFiles === maps.length) {
		clearInterval(check);
		scaleImages();
	}
}, 1000);

function scaleImages() {
	var i = 0;
	var files = fs.readdirSync('./maps/');

	function scaleImage() {
		if (i >= files.length) {
			console.log('Finished scaling images to 512x512 (Discord Requirement)');
			return;
		}

		var buffer = fs.readFileSync('./maps/' + files[i]);
		sharp(buffer).resize(512, 512).toBuffer().then((data) => {
			fs.writeFileSync('./maps/' + files[i], data);

			console.log('Successfully scaled ' + files[i]);

			i++;
			scaleImage();
		}).catch((e) => {
			console.log('Failed to scale ' + files[i]);
			console.error(e);

			i++;
			scaleImage();
		});
	}
	scaleImage();
}