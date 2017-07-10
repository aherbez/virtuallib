const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const Canvas = require('canvas');
const Image = Canvas.Image;

const port = process.env.PORT || 5000;


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});


app.get('/page/:book/:pagenum', (req, res) => {
	let page = req.params.pagenum || '0';
	let bookId = req.params.book || 'aliceinwonderlan00carriala';

	let url = `http://archive.org/download/${bookId}/page/n${page}_medium.jpg`;
	request.get(url).pipe(res);
});

app.get('/img', (req, res) => {

	var canvas = new Canvas(200, 200);
	var ctx = canvas.getContext('2d');

	ctx.font = '30px Impact';
	ctx.rotate(.1);
	ctx.fillText('Awesome!', 50, 100);

	var te = ctx.measureText('Awesome!');
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.beginPath();
	ctx.lineTo(50, 102);
	ctx.lineTo(50 + te.width, 102);
	ctx.stroke();

	var stream = canvas.createPNGStream();
	res.type("png");
	stream.pipe(res);

});

app.get('/bookinfo/:olid', (req, res) => {
	const olid = req.params.olid;

	if (olid) {
		const dataUrl = `http://openlibrary.org/api/books?bibkeys=OLID:${olid}&jscmd=data&format=json`
		const infoUrl = `http://openlibrary.org/api/books?bibkeys=OLID:${olid}&jscmd=viewapi&format=json`

		request.get(dataUrl, (dataReq, dataRes) => {
			request.get(infoUrl, (infoReq, infoRes) => {

				let infoObj = JSON.parse(infoRes.body);
				let dataObj = JSON.parse(dataRes.body);
				let outObj = {};

				let info = null;				
				for (var key in dataObj) {
					if (dataObj.hasOwnProperty(key)) {
						// outObj[key] = dataObj[key];
						info = dataObj[key];
					}
				}
				if (info) {
					for (var key in info) {
						if (info.hasOwnProperty(key)) {
							outObj[key] = info[key];
						}
					}
				}

				for (var key in infoObj) {
					if (infoObj.hasOwnProperty(key)) {
						info = infoObj[key];
					}
				}

				if (info) {

					const preveiwUrlParts = info.preview_url.split('/');
					outObj.bookId = preveiwUrlParts[preveiwUrlParts.length-1];
				}
				res.send(JSON.stringify(outObj));
			})
		});
	}
});

app.listen(port, function() {
	console.log('listening on :' + port);
});
