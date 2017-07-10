function Book(w, h, t, c, bookId, callback) {
	this.width = w + Book.MARGIN;
	this.height = h + (Book.MARGIN * 2);
	this.thickness = t;

	this.pageW = w;
	this.pageH = h;
	this.pageT = t;

	this.bookId = bookId;

	this.theta = 0;
	this.progress = 0;

	this.spineTex;

	this.coverT = c || Book.COVER_THICK;

	this.coverColor = "rgb(204, 100, 123)";
	this.textColor = "rgb(249, 189, 67)";

	this.title = 'Book Title';
	this.author = 'Hagbard Celine';

	this.olid = bookId;

	this.doneLoading = false;
	this.bookData = null;

	this.loadedCallback = callback;

	this.location = 0;

	this.clock = new THREE.Clock();
	this.animationCount = 0;

	this.pageAnimating = false;

	this.textures = [];

	this.maxPage = 100;

	const dataUrl = `/bookinfo/${this.olid}`;

	this.getUrl(dataUrl, 'GET')
		.then((data) => {
			
			this.bookData = JSON.parse(data);
			console.log(this.bookData)
			this.bookId = this.bookData.bookId;

			console.log(this.bookData.pagination);

			this.title = this.bookData.title;
			this.author = this.bookData.authors[0].name;

			const pages = parseInt(this.bookData.pagination.split(',')[0]);
			console.log(pages);
			this.maxPage = pages;

			this.init();

			this.updateTextures();

			this.doneLoading = true;
			this.loadedCallback(this);
			// this.turnPage();
		});
	
};

Book.prototype.isDoneLoading = function() {
	return this.doneLoading;
};

Book.prototype.getUrl = function(url, method, data) {
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
};

Book.MARGIN = 0.15;
Book.LEFT = 0;
Book.RIGHT = 1;
Book.COVER_THICK = 0.1;
Book.SPINE_DIVS = 10;

Book.prototype.makeCover = function() {
	const plane = new THREE.PlaneGeometry(
		this.width * 0.9,
		this.height * 0.9
	);

	this.coverMat = new THREE.MeshBasicMaterial({
		color: 0xAAAAAA
	})

	this.cover = new THREE.Mesh(plane, this.coverMat);
	this.cover.rotation.x = - Math.PI/2;
	this.cover.rotation.y = - Math.PI/2;
	this.cover.position.x = -(this.coverT + 0.05);
	this.cover.position.y = this.width/2;

	this.leftCover.add(this.cover);
};

Book.prototype.makePages = function() {
	this.pagesLeft = new BookPages(this.pageH,
		this.pageW,
		this.pageT,
		0,
		true
	);

	this.pagesRight = new BookPages(this.pageH,
		this.pageW,
		this.pageT,
		0,
		false
	);

	this.mesh.add(this.pagesRight.mesh);
	this.mesh.add(this.pagesLeft.mesh);
};

Book.prototype.makeCenterPage = function() {
	this.centerPage = new Page(this.pageW,
		this.pageH, this.thickness);
	this.centerPage.mesh.position.y = 0.005;
	this.mesh.add(this.centerPage.mesh);
};

Book.prototype.turnPage = function(dir) {
	if (this.centerPage.animating) return;

	const newLoc = this.location + (dir * 2);
	if (newLoc < 0 || newLoc > this.maxPage) return;

	this.location = newLoc;

	if (dir < 0) {
		this.pagesLeft.setTexture(this.textures[0]);
		this.pagesRight.setTexture(this.textures[3]);
		this.centerPage.setPageTexture(this.textures[1], Page.ODD);
		this.centerPage.setPageTexture(this.textures[2], Page.EVEN);		
	} else {
		this.pagesLeft.setTexture(this.textures[2]);
		this.pagesRight.setTexture(this.textures[5]);
		this.centerPage.setPageTexture(this.textures[3], Page.ODD);
		this.centerPage.setPageTexture(this.textures[4], Page.EVEN);
	}

	this.centerPage.animateFlip(dir, () => {
			this.updateTextures(dir);
			this.updateMainTextures();
		});
};

Book.prototype.updateMainTextures = function() {
	this.pagesLeft.setTexture(this.textures[2]);
	this.pagesRight.setTexture(this.textures[3]);
};

Book.prototype.makeUpdateFunc = function(dir, book) {
	return function() {
		book.updateTextures(dir).then((dir) => {
			if (dir < 0) {
				book.pagesRight.setTexture(this.textures[3]);			
			} else {
				book.pagesLeft.setTexture(this.textures[2]);
			}
		});
	};
};

Book.prototype.updateTextures = function(dir) {
	return new Promise((resolve, reject) => {
		if (dir < 0) {
			for (let i=5; i>1; i--) {
				this.textures[i] = this.textures[i-2];
			}
			this.updatePageTex(0);
			this.updatePageTex(1);
		} else {
			for (let i=0; i<4; i++) {
				this.textures[i] = this.textures[i+2];
			}
			this.updatePageTex(4);
			this.updatePageTex(5);		
		}
	})
};

Book.prototype.updatePageTex = function(i) {
	const offset = i - 2;

	let num = this.location + offset;

	if ((num >= 0) && (num <= this.maxPage)) {
		let loader = new THREE.TextureLoader();
		let url = `/page/${this.bookId}/${num}`;
		loader.load(url, this.makeTextureFunction(i, this.textures));
	}

};

Book.prototype.makeTextureFunction = function(i, texArray) {
	return function(tex) {
		texArray[i] = tex;
	};
}

Book.prototype.loadTextures = function() {
	var coverImgLoader = new THREE.TextureLoader();
	coverImgLoader.load('coverGray.jpg', (tex) => {
		this.mat.setValues({
			map: tex,
			color: this.coverColor,
			wireframe: false,
		});
		this.mat.needsUpdate = true;
		this.coverTex = tex;
		this.setSpineTexture();
	});

	const coverSrc = `page/${this.bookId}/0`;;

	var coverImageImgLoader = new THREE.TextureLoader();
	coverImageImgLoader.load(coverSrc, (tex) => {
		this.coverMat.setValues({
			map: tex,
			color: 0xFFFFFF,
			wireframe: false,
		});
		this.coverMat.needsUpdate = true;

	});

	var pageImgLoader = new THREE.TextureLoader();
	pageImgLoader.load('pageSq.jpg', (tex) => {
		this.centerPage.setTexture(tex);
		this.pagesLeft.setTexture(tex);
		this.pagesRight.setTexture(tex);
	});
};

Book.prototype.initSpineTexture = function() {
	this.spineCanvas = document.createElement('canvas');
	this.spineCanvas.width = this.spineCanvas.height = 512;

	// this.spineCanvas = document.getElementById('testCanvas');
};

Book.prototype.setSpineTexture = function() {
	let ctx = this.spineCanvas.getContext('2d');

	ctx.fillStyle = this.coverColor;
	ctx.fillRect(0, 0, 512, 512);
	ctx.globalCompositeOperation = 'multiply';
	ctx.drawImage(this.coverTex.image, 0, 0);
	ctx.globalCompositeOperation = 'source-over';

	ctx.font = '30pt Arial';
	ctx.fillStyle = this.textColor;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	let titleParts = this.title.split(' ').filter((t) => {
		return t.length > 0;
	});

	let authorParts = this.author.split(' ').filter((w) => {
		return w.length > 0;
	});

	let x = this.spineCanvas.width/4;
	let y = this.spineCanvas.height * 0.1;

	titleParts.forEach((w) => {
		ctx.fillText(w, x, y);
		y += 40;
	});

	ctx.font = '20pt Arial';
	ctx.fillText('by', x, y);
	y += 35;

	authorParts.forEach((w) => {
		ctx.fillText(w, x, y);
		y += 40;
	});

	this.spineTex = new THREE.CanvasTexture(this.spineCanvas);

	this.spineMat.setValues({
		map: this.spineTex,
		color: 0xFFFFFF,
		wireframe: false,
	});
	this.spineMat.needsUpdate = true;	
};

Book.prototype.init = function() {
	this.initSpineTexture();

	this.mesh = new THREE.Group();

	this.mat = new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		wireframe: true
	});

	this.spineMat = new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		wireframe: true
	})

	this.leftCover = this.makeCoverSide(Book.LEFT);
	this.rightCover = this.makeCoverSide(Book.RIGHT);
	this.spine = this.makeSpine();

	this.leftCover.position.x = -this.thickness/2;
	this.rightCover.position.x = this.thickness/2;

	this.mesh.add(this.leftCover);
	this.mesh.add(this.rightCover);
	this.mesh.add(this.spine);
	
	this.makePages();
	this.makeCenterPage();
	this.makeCover();

	this.centerPage.setVisible(false);

	this.loadTextures();
};

Book.prototype.setOpen = function(theta) {
	if (Math.abs(this.theta - theta) < 0.01) return;
	this.theta = theta;
	
	this.leftCover.rotation.z = this.theta;
	this.rightCover.rotation.z = -this.theta;

	this.pagesLeft.setTheta(this.theta, true);
	this.pagesRight.setTheta(-this.theta, true);

	this.centerPage.setOpen(this.theta);
	this.updateSpineVerts();
}

Book.prototype.setProgress = function(progress) {
	this.progress = progress;
	this.pagesLeft.setProgress(this.progress);
	this.pagesRight.setProgress(1-this.progress);
	this.centerPage.setProgress(this.progress);
}

Book.prototype.makeCoverSide = function(side) {
	const geo = new THREE.Geometry();

	let x, y, z, u;
	/*
		2-3
		|\|
		0-1
	*/
	for (let i=0; i<8; i++) {
		if (i < 4) {
			x = (side == Book.LEFT) ? 0 : this.coverT;
		} else {
			x = (side == Book.LEFT) ? -this.coverT : 0;
		}
		u = i % 4;
		y = (u < 2) ? 0 : this.width;
		z = (u % 2) ? this.height/2 : -this.height/2;
		geo.vertices.push(new THREE.Vector3(x,y,z));
	}

	let uv;
	let uvs = [];
	for (let i=0; i < 4; i++) {
		uv = new THREE.Vector2();
		uv.x = (i % 2) ? 0 : 1;
		uv.y = (i < 2) ? 0 : 1;
		uvs.push(uv);
	}

	let uvMult = new THREE.Vector2(1, 1);
	let uvOffset = new THREE.Vector2(0, 0);

	// right side (inner for left, outer for right)
	geo.faces.push(new THREE.Face3(0, 2, 1));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)]);
	geo.faces.push(new THREE.Face3(1, 2, 3));
	geo.faceVertexUvs[0].push([
		uvs[1].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset)]);

	// left side (inner for right, outer for left)
	geo.faces.push(new THREE.Face3(7, 6, 5));
	geo.faceVertexUvs[0].push([
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset),
		uvs[0].clone().multiply(uvMult).add(uvOffset)
	]);
	geo.faces.push(new THREE.Face3(6, 4, 5));
	geo.faceVertexUvs[0].push([
		uvs[3].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset),
		uvs[0].clone().multiply(uvMult).add(uvOffset)
	]);


	uvMult.x = 0.05;
	uvMult.y = 1;
	// top
	geo.faces.push(new THREE.Face3(3, 2, 6));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset)
	]);
	geo.faces.push(new THREE.Face3(3, 6, 7));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)
	]);
	
	// bottom
	geo.faces.push(new THREE.Face3(5,4,0));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset)
	]);
	geo.faces.push(new THREE.Face3(5,0,1));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)
	]);
	
	// front
	geo.faces.push(new THREE.Face3(1, 3, 5));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)
	]);
	geo.faces.push(new THREE.Face3(5, 3, 7));
	geo.faceVertexUvs[0].push([
		uvs[1].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset)
	]);

	// back
	geo.faces.push(new THREE.Face3(4, 6, 0));
	geo.faceVertexUvs[0].push([
		uvs[0].clone().multiply(uvMult).add(uvOffset),
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)
	]);
	geo.faces.push(new THREE.Face3(6, 2, 0));
	geo.faceVertexUvs[0].push([
		uvs[2].clone().multiply(uvMult).add(uvOffset),
		uvs[3].clone().multiply(uvMult).add(uvOffset),
		uvs[1].clone().multiply(uvMult).add(uvOffset)
	]);
	

	return new THREE.Mesh(geo, this.mat);
};

Book.prototype.makeSide = function(p) {	
	if (!p.geo) return;
	let geo = p.geo;
	let curve1 = p.curve1;
	let curve2 = p.curve2;
	let divs = p.divs;
	let uvExtents = p.uvExtents || [[0,1],[0,1]];

	let offset1 = (divs+1) * curve1;	
	let offset2 = (divs+1) * curve2;	
	
	let v1, v2, v3, v4;
	let uv1, uv2, uv3, uv4;
	uv1 = new THREE.Vector2();
	uv2 = new THREE.Vector2();
	uv3 = new THREE.Vector2();
	uv4 = new THREE.Vector2();


	let uRange = uvExtents[0][1] - uvExtents[0][0];
	let vRange = uvExtents[1][1] - uvExtents[1][0];

	let u = uRange / Book.SPINE_DIVS;

	for (let i=0; i < Book.SPINE_DIVS; i++) {
		v1 = i + offset1;
		v2 = i + 1 + offset1;
		v3 = i + 1 + offset2;
		v4 = i + offset2;

		uv1.x = (u * i) + uvExtents[0][0]; // u * i;
		uv1.y = uvExtents[1][0]; // 0;

		uv2.x = (u * (i + 1)) + uvExtents[0][0]; // u * (i+1);
		uv2.y = uvExtents[1][0]; // 0;

		uv3.x = (u * (i + 1)) + uvExtents[0][0]; // u * (i+1);		
		uv3.y = uvExtents[1][1]; // 1;

		uv4.x = (u * i) + uvExtents[0][0]; // u * i;
		uv4.y = uvExtents[1][1]; // 1;
		
		geo.faces.push(new THREE.Face3(v1, v2, v4));
		geo.faceVertexUvs[0].push([
			new THREE.Vector2(uv1.x, uv1.y),
			new THREE.Vector2(uv2.x, uv2.y),
			new THREE.Vector2(uv4.x, uv4.y)]);

		geo.faces.push(new THREE.Face3(v2, v3, v4));
		geo.faceVertexUvs[0].push([
			new THREE.Vector2(uv2.x, uv2.y),
			new THREE.Vector2(uv3.x, uv3.y),
			new THREE.Vector2(uv4.x, uv4.y)]);
	}
}

Book.prototype.makeSpine = function() {
	const geo = new THREE.Geometry();

	let pt;
	let curvePts = [];
	let thetaDelta = Math.PI / (Book.SPINE_DIVS);

	for (let i=0; i < Book.SPINE_DIVS+1; i++) {
		pt = new THREE.Vector2();
		pt.x = Math.cos(i * thetaDelta) * this.thickness/2;
		pt.y = -Math.sin(i * thetaDelta) * this.thickness/2 * 0.25;
		curvePts.push(pt);
	}

	let x,y,z, index, ci;
	for (let i=0; i < ((Book.SPINE_DIVS + 1) * 4); i++) {
		index = i % (Book.SPINE_DIVS + 1);
		ci = Math.floor(i / (Book.SPINE_DIVS + 1)); 
		x = curvePts[index].x;
		y = curvePts[index].y;
		z = (ci % 2) ? this.height/2 : -this.height/2;
		if (ci > 1) {
			y -= this.coverT;
		}
		geo.vertices.push(new THREE.Vector3(x,y,z));		
	}

	// inner spine
	this.makeSide({
		geo: geo,
		curve1: 0,
		curve2: 1,
		divs: Book.SPINE_DIVS,
		uvExtents: [[0,0.5],[0,1]],
	});

	// edge
	this.makeSide({
		geo: geo,
		curve1: 2,
		curve2: 0,
		divs: Book.SPINE_DIVS,
		uvExtents: [[0,0.5],[0.1,0.1]],
	});
	
	// outer spine
	this.makeSide({
		geo: geo,
		curve1: 3,
		curve2: 2,
		divs: Book.SPINE_DIVS,
		uvExtents: [[0,0.5],[0,1]],
	});
	
	// edge
	this.makeSide({
		geo: geo,
		curve1: 1,
		curve2: 3,
		divs: Book.SPINE_DIVS,
		uvExtents: [[0,0.5],[0.1,0.1]],
	});
	
	return new THREE.Mesh(geo, this.spineMat);
};

Book.prototype.updateSpineVerts = function() {
	let pt;
	let curvePts = [];
	let curvePtsOuter = [];
	let thetaDelta = Math.PI / (Book.SPINE_DIVS);
	let animMult = this.theta / (Math.PI/2);
	animMult = 0.75 - (0.5 * animMult);
	animMult = 1;

	let centerPt = new THREE.Vector2();
	centerPt.x = 0;
	centerPt.y = this.thickness;

	let coverPtInner = new THREE.Vector2();
	coverPtInner.x = this.thickness/2;
	coverPtInner.y = 0;

	let coverPtOuter = new THREE.Vector2();
	coverPtOuter.x = Math.cos(this.theta) * this.coverT;
	coverPtOuter.x += this.thickness/2;
	coverPtOuter.y = -Math.sin(this.theta) * this.coverT;

	let currSpineTheta;

	let distToOuter = coverPtOuter.sub(centerPt);
	let outerSpineTheta = Math.atan(distToOuter.y / distToOuter.x) + Math.PI/2;
	let outerR = distToOuter.length();

	let distToInner = coverPtInner.sub(centerPt);
	let innerSpineTheta = Math.atan(distToInner.y / distToInner.x) + Math.PI/2;
	let innerR = distToInner.length();

	for (let i=0; i < Book.SPINE_DIVS+1; i++) {
		pt = new THREE.Vector2();
		pt.x = Math.cos(i * thetaDelta) * this.thickness/2;
		pt.y = -Math.sin(i * thetaDelta) 
			* this.thickness/2;

		currSpineTheta = innerSpineTheta * -(((i/(Book.SPINE_DIVS)) * 2) - 1);
		currSpineTheta -= Math.PI/2;
		
		pt.x = Math.cos(currSpineTheta) * innerR + centerPt.x;
		pt.y = Math.sin(currSpineTheta) * innerR + centerPt.y;

		curvePts.push(pt);
	}

	for (let i=0; i < Book.SPINE_DIVS+1; i++) {
		pt = new THREE.Vector2();
		
		currSpineTheta = outerSpineTheta * -(((i/(Book.SPINE_DIVS)) * 2) - 1);
		currSpineTheta -= Math.PI/2;
		
		pt.x = Math.cos(currSpineTheta) * outerR + centerPt.x;
		pt.y = Math.sin(currSpineTheta) * outerR + centerPt.y;

		curvePtsOuter.push(pt);
	}

	let x,y,z, index, ci;
	for (let i=0; i < ((Book.SPINE_DIVS + 1) * 4); i++) {
		index = i % (Book.SPINE_DIVS + 1);
		ci = Math.floor(i / (Book.SPINE_DIVS + 1)); 
			
		if (ci < 2) {
			x = curvePts[index].x;
			y = curvePts[index].y;
		} else {
			x = curvePtsOuter[index].x;
			y = curvePtsOuter[index].y;
		}
		z = (ci % 2) ? this.height/2 : -this.height/2;
		this.spine.geometry.vertices[i].x = x;
		this.spine.geometry.vertices[i].y = y;
		this.spine.geometry.vertices[i].z = z;
	}
	this.spine.geometry.verticesNeedUpdate = true;
}

Book.prototype.updateGeo = function() {
};

Book.prototype.setPageFlip = function(f) {
	this.centerPage.setFlipValue(f);
}

Book.prototype.update = function(delta) {
	this.centerPage.update(delta);
}