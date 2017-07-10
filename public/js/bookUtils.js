/**
 * Utilities for things common to various parts of books.
 */
function BookUtils() {
};


/**
 * Adds a series of faces in an input geometry.
 * @param  {object}
 */
BookUtils.makeSide = function(p) {	
	if (!p.geo || !p.divs) return;
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

	let u = uRange / divs;

	for (let i=0; i < divs; i++) {
		v1 = i + offset1;
		v2 = i + 1 + offset1;
		v3 = i + 1 + offset2;
		v4 = i + offset2;

		uv1.x = (u * i) + uvExtents[0][0]; // u * i;
		uv1.y = uvExtents[1][1]; // 0;

		uv2.x = (u * (i + 1)) + uvExtents[0][0]; // u * (i+1);
		uv2.y = uvExtents[1][1]; // 0;

		uv3.x = (u * (i + 1)) + uvExtents[0][0]; // u * (i+1);		
		uv3.y = uvExtents[1][0]; // 1;

		uv4.x = (u * i) + uvExtents[0][0]; // u * i;
		uv4.y = uvExtents[1][0]; // 1;
		
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
};


function BookCurve(w, h, t, isInner) {
	this.width = w;
	this.height = h;
	this.thick = t;
	this.inner = isInner || false;

	this.curve = new THREE.CubicBezierCurve(
		new THREE.Vector3(), new THREE.Vector3(),
		new THREE.Vector3(), new THREE.Vector3());
};

BookCurve.prototype.update = function(theta, progress) {
	const sheafThick = this.thick * progress;

	const baseX = -(this.thick/2) + (this.thick * progress);
	let thetaTemp;

	if (this.inner) {
		this.curve.v0.x = baseX;
		this.curve.v0.y = 0;

		thetaTemp = theta * 0.1 + Math.PI/2;
		this.curve.v1.x = Math.cos(thetaTemp) * (sheafThick * 1) + baseX;
		this.curve.v1.y = Math.sin(thetaTemp) * (sheafThick * 1);

		thetaTemp = theta * 0.8 + Math.PI/2;
		this.curve.v2.x = Math.cos(thetaTemp) * (this.width * 0.6) + baseX;
		this.curve.v2.y = Math.sin(thetaTemp) * (this.width * 0.6);

		thetaTemp = (theta * 0.9) + Math.PI/2;
		this.curve.v3.x = Math.cos(thetaTemp) * (this.width) + baseX;
		this.curve.v3.y = (Math.sin(thetaTemp) * this.width);
	} else {
		this.curve.v0.x = baseX;
		this.curve.v0.y = 0;

		thetaTemp = theta * 0.1 + Math.PI/2;
		this.curve.v1.x = Math.cos(thetaTemp) * (sheafThick * 0.25) + baseX;
		this.curve.v1.y = Math.sin(thetaTemp) * (sheafThick * 0.25);

		thetaTemp = theta * 0.8 + Math.PI/2;
		this.curve.v2.x = Math.cos(thetaTemp) * (this.width * 0.6) + baseX;
		this.curve.v2.y = Math.sin(thetaTemp) * (this.width * 0.6);

		thetaTemp = theta + Math.PI/2;
		this.curve.v3.x = Math.cos(thetaTemp) * (this.width) + baseX;
		this.curve.v3.y = Math.sin(thetaTemp) * this.width;
	}
};

BookCurve.prototype.getPointAt = function(u) {
	return this.curve.getPointAt(u);
}

