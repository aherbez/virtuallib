const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const Canvas = require('canvas');
const Image = Canvas.Image;

const port = 3000;


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});


app.get('/page/:book/:pagenum', (req, res) => {

	//http://www.archive.org/stream/aliceinwonderlan00carriala#page/23
	// res.sendFile(__dirname + '/images/testPage.jpg');
	
	// console.log(req.params);
	let page = req.params.pagenum || '0';
	let bookId = req.params.book || 'aliceinwonderlan00carriala';

	/*
	http://archive.org/download/books/OL7170815M/page/n0_medium.jpg	
	/books/OL7170815M

http://openlibrary.org/api/books?bibkeys=OLID:OL7170815M&jscmd=viewapi&format=json
{
	"OLID:OL7170815M": {
		"bib_key": "OLID:OL7170815M", 
		"preview": "full", 
		"thumbnail_url": "https://covers.openlibrary.org/b/id/7000537-S.jpg", 
		"preview_url": "https://archive.org/details/wonderfulwizardo00baumiala", 
		"info_url": "http://openlibrary.org/books/OL7170815M/The_Wonderful_Wizard_of_Oz"
	}
}



http://openlibrary.org/api/books?bibkeys=OLID:OL7170815M&jscmd=data&format=json

	http://openlibrary.org/api/books?bibkeys=OLID:OL7170815M&jscmd=viewapi&format=json
	 */


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

	// res.write(canvas.jpegStream());
	// console.log('<img src="' + canvas.toDataURL() + '"/>');	
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

		// request.get(dataUrl).pipe(res);
	}
});

app.post('/quotes', (req, res) => {
	console.log(req.body);
});

app.listen(port, function() {
	console.log('listening on :' + port);
});
