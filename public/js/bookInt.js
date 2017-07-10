function Book(h, w, t, theta, isLeft) {
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

Book.PAGE_DIV = 10;

Book.prototype.setProgress = function(u) {
	this.progress = this.isLeft ? u : 1 - u;
}

Book.prototype.setTheta = function(t) {
	this.theta = t;
}

Book.prototype.makeSide = function(curve1, curve2) {
	let offset1 = (Book.PAGE_DIV+1) * curve1;	
	let offset2 = (Book.PAGE_DIV+1) * curve2;	
	
	let v1, v2, v3, v4;
	let uv1, uv2, uv3, uv4;
	uv1 = new THREE.Vector2();
	uv2 = new THREE.Vector2();
	uv3 = new THREE.Vector2();
	uv4 = new THREE.Vector2();

	let u = 1 / Book.PAGE_DIV;

	for (let i=0; i < Book.PAGE_DIV; i++) {
		v1 = i + offset1;
		v2 = i + 1 + offset1;
		v3 = i + 1 + offset2;
		v4 = i + offset2;

		uv1.y = 0;
		uv1.x = u * i;

		uv2.y = 0;
		uv2.x = u * (i+1);
		
		uv3.y = 1;
		uv3.x = u * (i+1);

		uv4.y = 1;
		uv4.x = u * i;

		if (this.isLeft) {
			uv1.y = uv2.y = 1;
			uv3.y = uv4.y = 0;

			uv1.x = 1 - uv1.x;
			uv2.x = 1 - uv2.x;
			uv3.x = 1 - uv3.x;
			uv4.x = 1 - uv4.x;
		}

		this.geo.faces.push(new THREE.Face3(v1, v2, v4));
		this.geo.faceVertexUvs[0].push([
			new THREE.Vector2(uv1.x, uv1.y),
			new THREE.Vector2(uv2.x, uv2.y),
			new THREE.Vector2(uv4.x, uv4.y)]);

		this.geo.faces.push(new THREE.Face3(v2, v3, v4));
		this.geo.faceVertexUvs[0].push([
			new THREE.Vector2(uv2.x, uv2.y),
			new THREE.Vector2(uv3.x, uv3.y),
			new THREE.Vector2(uv4.x, uv4.y)]);
	}	
}

Book.prototype.makeCaps = function() {
	let v0, v1, v2, v3;
	let uv0, uv1, uv2, uv3;

	v0 = (Book.PAGE_DIV+1) * 0 + Book.PAGE_DIV;
	v1 = (Book.PAGE_DIV+1) * 1 + Book.PAGE_DIV;
	v2 = (Book.PAGE_DIV+1) * 2 + Book.PAGE_DIV;
	v3 = (Book.PAGE_DIV+1) * 3 + Book.PAGE_DIV;

	uv0 = new THREE.Vector2(0,0);
	uv1 = new THREE.Vector2(0,1);
	uv2 = new THREE.Vector2(1,1);
	uv3 = new THREE.Vector2(1,0);

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

Book.prototype.init = function() {
	this.outerCurve = new THREE.CubicBezierCurve(
		new THREE.Vector3(), new THREE.Vector3(),
		new THREE.Vector3(), new THREE.Vector3());

	this.innerCurve = new THREE.CubicBezierCurve(
		new THREE.Vector3(), new THREE.Vector3(),
		new THREE.Vector3(), new THREE.Vector3());

	this.geo = new THREE.Geometry();

	for (let i=0; i < (Book.PAGE_DIV+1) * 4; i++) {
		this.geo.vertices.push(new THREE.Vector3(0,0,0));
	}

	/*
		3----7
		|	 |
		|	 |
		2----6
		|    |
		|	 |	
		1----5
		|    |
		|	 |	
		0----4

		PAGE_DIV = 3
	*/
	
	if (this.isLeft) {
		this.makeSide(0, 1);
		this.makeSide(2, 3);
		this.makeSide(1, 2);
		this.makeSide(3, 0);
	}
	else {
		this.makeSide(1, 0);
		this.makeSide(3, 2);
		this.makeSide(2, 1);
		this.makeSide(0, 3);
	}

	this.makeCaps();
	this.updateGeo();

	this.mat = new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		wireframe: true
	});

	this.mat.side = THREE.FrontSide;
	this.mesh = new THREE.Mesh(this.geo, this.mat);

	var pageImgLoader = new THREE.TextureLoader();
	pageImgLoader.load('pageSq.jpg', (tex) => {
		this.mat.setValues({
			map: tex,
			color: 0xFFFFFF,
			wireframe: false,
		});
		this.mat.needsUpdate = true;
	});	
}

Book.prototype.updateCurves = function() {
	const outerX = this.isLeft ? -(this.thickness/2) : (this.thickness/2);
	const sheafThick = this.thickness * this.progress;
	const innerX = this.isLeft ? outerX + sheafThick : outerX - sheafThick;

	// INNER CURVE

	this.innerCurve.v0.x = innerX;
	this.innerCurve.v0.y = 0;

	let thetaTemp = this.theta * 0.1 + Math.PI/2;
	this.innerCurve.v1.x = Math.cos(thetaTemp) * (sheafThick * 1) + innerX;
	this.innerCurve.v1.y = Math.sin(thetaTemp) * (sheafThick * 1);

	thetaTemp = this.theta * 0.8 + Math.PI/2;
	this.innerCurve.v2.x = Math.cos(thetaTemp) * (this.width * 0.6) + innerX;
	this.innerCurve.v2.y = Math.sin(thetaTemp) * (this.width * 0.6);

	thetaTemp = (this.theta * 0.9) + Math.PI/2;
	this.innerCurve.v3.x = Math.cos(thetaTemp) * (this.width) + innerX;
	this.innerCurve.v3.y = (Math.sin(thetaTemp) * this.width); // + (sheafThick * 0.5);


	// OUTER CURVE

	this.outerCurve.v0.x = outerX;
	this.outerCurve.v0.y = 0;

	thetaTemp = this.theta * 0.1 + Math.PI/2;
	this.outerCurve.v1.x = Math.cos(thetaTemp) * (sheafThick * 0.25) + outerX;
	this.outerCurve.v1.y = Math.sin(thetaTemp) * (sheafThick * 0.25);

	thetaTemp = this.theta * 0.8 + Math.PI/2;
	this.outerCurve.v2.x = Math.cos(thetaTemp) * (this.width * 0.6) + outerX;
	this.outerCurve.v2.y = Math.sin(thetaTemp) * (this.width * 0.6);

	thetaTemp = this.theta + Math.PI/2;
	this.outerCurve.v3.x = Math.cos(thetaTemp) * (this.width) + outerX;
	this.outerCurve.v3.y = Math.sin(thetaTemp) * this.width;
}

Book.prototype.updateVerts = function() {
	let u = 0;
	let pt;
	let offset = 0;

	for (let i=0; i<Book.PAGE_DIV+1; i++) {
		u = 1/Book.PAGE_DIV * i;

		offset = 0;

		pt = this.outerCurve.getPointAt(u);
		this.geo.vertices[i].x = pt.x;
		this.geo.vertices[i].y = pt.y;
		this.geo.vertices[i].z = -this.height/2;

		offset += Book.PAGE_DIV+1;

		pt = this.innerCurve.getPointAt(u);
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = -this.height/2;		

		offset += Book.PAGE_DIV+1;

		pt = this.innerCurve.getPointAt(u);
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = this.height/2;

		offset += Book.PAGE_DIV+1;

		pt = this.outerCurve.getPointAt(u);
		this.geo.vertices[offset+i].x = pt.x;
		this.geo.vertices[offset+i].y = pt.y;
		this.geo.vertices[offset+i].z = this.height/2;
	}
}

Book.prototype.updateGeo = function() {
	this.updateCurves();
	this.updateVerts();
	this.geo.verticesNeedUpdate = true;
}