var scene, camera, renderer;
var book;

let bookOpen = 0; // Math.PI/2;
let bookProgress = 0.5;
let animation = true;

const clock = new THREE.Clock();
let animationCount = 0;

function init() {
	document.addEventListener('keydown', updateInput);

	scene = new THREE.Scene();
	var WIDTH = window.innerWidth,
		HEIGHT = window.innerHeight;

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(WIDTH, HEIGHT);
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 20000);
	camera.position.set(0, 0, 7);
	scene.add(camera);

	window.addEventListener('resize', () => {
		var WIDTH = window.innerWidth,
			HEIGHT = window.innerHeight;
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
	});

	var ambLight = new THREE.AmbientLight(0x888888);
	scene.add(ambLight);

	var light = new THREE.PointLight(0xFFFFFF);
	light.position.set(-100, 200, 100);
	scene.add(light);

	book = new Book(3, 4, 0.5, null, 'OL7170815M', function(book) {
		book.setOpen(Math.PI/2);
		book.setProgress(bookProgress);
		book.mesh.rotation.z = 0; //-Math.PI/2;

		book.mesh.rotation.x = Math.PI/2;
		book.mesh.rotation.y = 0; // Math.PI/2;		
		scene.add(book.mesh);
	}); 
	
	// loadBookData();
};

function getUrl(url, method, data) {
	return new Promise(function(resolve, reject) {
		const request = new XMLHttpRequest();
		request.responseType = 'text';
		request.onreadystatechange = function() {
			if (request.readyState === XMLHttpRequest.DONE) {
				if (request.status === 200) {
					resolve(request.responseText);
				} else {
					reject(Error(request.statusText()));
				}
			}
		};
		request.onerror = function() {
			reject(Error('Network Error'));
		};
		request.open(method, url, true);
		request.send(data);
	});
}

function loadBookData() {
	
	const url = 'http://openlibrary.org/api/books?bibkeys=ISBN:0201558025,LCCN:93005405';

	getUrl(url,'GET').then((result) => {
		console.log(result);
	})

	/*
	let p = new Promise((resolve, reject) => {
		setTimeout(function() {
			resolve('Success!');
		}, 250);
	});

	p.then((successMessage) => {
		alert('yay ' + successMessage);
	})
	*/
};

function updateInput(ev) {
	// console.log(ev);

	switch (ev.keyCode) {
		case 38: // up
			bookOpen += 0.01;
			break;
		case 37: // left
			// bookProgress -= 0.01;
			book.turnPage(-1);
			break;
		case 40: // down
			bookOpen -= 0.01;
			break;
		case 39: // right
			// bookProgress += 0.01;
			book.turnPage(1);
			break;
		case 32:
			animation = !animation;
			break;
		default:
			break;
	}

	if (bookOpen < 0) bookOpen = 0;
	if (bookOpen > Math.PI/2) bookOpen = Math.PI/2;
	if (bookProgress < 0) bookProgress = 0;
	if (bookProgress > 1) bookProgress = 1;

}

function render() {

	const d = clock.getDelta();

	if (book.isDoneLoading()) {

		if (book && animation) {
			book.mesh.rotation.z += 0.02;
		}

		book.setOpen(bookOpen);
		book.setProgress(bookProgress);
		book.update(d);		
		
		/*
		book.mesh.rotation.x = Math.PI/2;
		book.mesh.rotation.y = 0; // Math.PI/2;
		// book.mesh.rotation.z = 0; // Math.PI/2;

		book.setOpen(bookOpen);
		book.setProgress(bookProgress);

		if (book) {
			animationCount += clock.getDelta();
			book.setPageFlip(Math.sin(animationCount));
			book.update();
		}
		*/
	}
	requestAnimationFrame(render);
	renderer.render(scene, camera);

}

init();
render();