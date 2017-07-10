function BookPages(h, w, t, theta, isLeft) {
	this.width = w;
	this.height = h;
	this.thickness = t;
	this.progress = 0;
	this.theta = Math.PI/2 * theta;
	this.isLeft = isLeft;

	if (this.isLeft) {
		this.theta *= -1;
	} else {
		this.progress = 1 - this.progress;
	}
	this.outerCurve = null;
	this.innerCurve = null;

	this.init();
}

BookPages.PAGE_DIV = 10;

BookPages.prototype.setProgress = function(u, skipUpdate) {
	this.progress = this.isLeft ? u : 1 - u;
	if (!skipUpdate) this.updateGeo();
}

BookPages.prototype.setTheta = function(t, skipUpdate) {
	this.theta = t;
	if (!skipUpdate) this.updateGeo();
}

BookPages.prototype.makeCaps = function() {
	let v0, v1, v2, v3;
	let uv0, uv1, uv2, uv3;

	v0 = (BookPages.PAGE_DIV+1) * 0 + BookPages.PAGE_DIV;
	v1 = (BookPages.PAGE_DIV+1) * 1 + BookPages.PAGE_DIV;
	v2 = (BookPages.PAGE_DIV+1) * 2 + BookPages.PAGE_DIV;
	v3 = (BookPages.PAGE_DIV+1) * 3 + BookPages.PAGE_DIV;

	uv0 = new THREE.Vector2(0.5,0);
	uv1 = new THREE.Vector2(0.5,1);
	uv2 = new THREE.Vector2(0.5,1);
	uv3 = new THREE.Vector2(0.5,0);

	if (this.isLeft) {
		this.geo.faces.push(new THREE.Face3(v3, v1, v0));
		this.geo.faceVertexUvs[0].push([uv3,uv1,uv0]);

		this.geo.faces.push(new THREE.Face3(v2, v1, v3));	
		this.geo.faceVertexUvs[0].push([uv2,uv1,uv3]);

	} else {
		this.geo.faces.push(new THREE.Face3(v0, v1, v3));
		this.geo.faceVertexUvs[0].push([uv0,uv1,uv3]);

		this.geo.faces.push(new THREE.Face3(v3, v1, v2));
		this.geo.faceVertexUvs[0].push([uv3,uv1,uv2]);		
	}	
}

BookPages.prototype.setTexture = function(tex) {
	this.mat.setValues({
		map: tex,
		color: 0xFFFFFF,
		wireframe: false,
	});
	this.mat.needsUpdate = true;
};


BookPages.prototype.init = function() {

	this.outerCurve = new BookCurve(
		this.width,
		this.height,
		this.thickness);

	this.innerCurve = new BookCurve(
		this.width,
		this.height,
		this.thickness,
		true);

	this.geo = new THREE.Geometry();

	for (let i=0; i < (BookPages.PAGE_DIV+1) * 4; i++) {
		this.geo.vertices.push(new THREE.Vector3(0,0,0));
	}
	
	if (this.isLeft) {
		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 0,
			curve2: 1,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0.5,0.5],[0,1]],
		});

		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 2,
			curve2: 3,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0.5,0.5],[0,1]],
		});


		BookUtils.makeSide({
			geo: this.geo,
			curve1: 1,
			curve2: 2,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[1,0],[0,1]],
		});
		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 3,
			curve2: 0,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0,1],[0,1]],
		});
		
	} else {

		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 1,
			curve2: 0,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0.5,0.5],[0,1]],
		});
		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 3,
			curve2: 2,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0.5,0.5],[0,1]],
		});
		
		
		BookUtils.makeSide({
			geo: this.geo,
			curve1: 2,
			curve2: 1,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0,1],[1,0]],
		});

		BookUtils.makeSide({
			geo: this.geo,
			curve1: 0,
			curve2: 3,
			divs: BookPages.PAGE_DIV,
			uvExtents: [[0,1],[1,0]],
		});
		
		
	}

	this.makeCaps();
	this.updateGeo();

	this.mat = new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		wireframe: true
	});

	this.mat.side = THREE.FrontSide;
	this.mesh = new THREE.Mesh(this.geo, this.mat);
}

BookPages.prototype.updateCurves = function() {
	this.innerCurve.update(this.theta, this.progress);
	this.outerCurve.update(
		this.theta,
		this.isLeft ? 0 : 1
	);
}

BookPages.prototype.updateVerts = function() {
	let u = 0;
	let pt;
	let offset = 0;

	for (let i=0; i<BookPages.PAGE_DIV+1; i++) {
		u = 1/BookPages.PAGE_DIV * i;

		offset = 0;

		pt = this.outerCurve.getPointAt(u);
		this.geo.vertices[i].x = pt.x;
		this.geo.vertices[i].y = pt.y;
		this.geo.vertices[i].z = -this.height/2;

		offset += BookPages.PAGE_DIV+1;

		pt = this.innerCurve.getPointAt(u);		
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = -this.height/2;		

		offset += BookPages.PAGE_DIV+1;

		pt = this.innerCurve.getPointAt(u);
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = this.height/2;

		offset += BookPages.PAGE_DIV+1;

		pt = this.outerCurve.getPointAt(u);
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = this.height/2;
	}
}

BookPages.prototype.updateGeo = function() {
	this.updateCurves();
	this.updateVerts();
	this.geo.verticesNeedUpdate = true;
}