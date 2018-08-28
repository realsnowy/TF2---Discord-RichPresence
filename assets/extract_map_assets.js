const request = require('request');
const cheerio = require('cheerio');

var images = [];
request('https://wiki.teamfortress.com/wiki/List_of_maps', (err, res, body) => {
	if (err) return console.error(err);

	const $ = cheerio.load(body);
	const trs = $('tr');
	for (let i in trs) {
		if (!trs[i] || !trs[i].children || trs[i].children.length < 1 || typeof trs[i].children !== 'object') continue;

		trs[i].children.forEach((c) => {
			if (!c.children || c.children.length < 1) return;

			var picture = undefined;
			for (let f in c.children) {
				if (c.children[f].name === 'a' && c.children[f].type === 'tag') {
					picture = c.children[f];
				}
			};
			if (!picture) return;

			var isPicture = false;
			if (!picture.children || picture.children.length < 1) return;
			picture.children.forEach((ccc) => {
				if (ccc.name === 'img' && ccc.type === 'tag') {
					isPicture = true;
				}
			});
			if (isPicture === false) return;

			var link = 'https://wiki.teamfortress.com' + picture.children[0].attribs.src;
			var name = picture.children[0].parent.attribs.title;
			var rawName = picture.parent.parent.children[7].children[1].children[0].data;
			images.push({ name: name, link: link, rawName: rawName });
		});;
	}

	const fs = require('fs');
	fs.writeFileSync('./map_assets.json', JSON.stringify(images, null, 4));
	console.log('Done. Check out ./map_assets.json');
});
