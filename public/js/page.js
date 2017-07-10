/**
 * A single, turnable page.
 */


var Page = function(w, h, thick) {
	this.width = w;
	this.height = h;
	this.thick = thick;

	this.mesh = null;		// the page
	this.geo = null;
	this.mesh = null;
	this.curve = null;

	this.animating = false;
	this.animDirection = null;
	this.pageAnim = 0;
	this.targetAnimVal = null;
	this.animFinishedCallback = null;

	this.theta = 0;
	this.maxTheta = 0;
	this.progress = 0.5;

	this.geoDirty = true;

	this.oddPageTex = null;
	this.evenPageTex = null;

	this.uniforms = {
		oddPageTex: {
			type:'t',
			value: new THREE.TextureLoader().load('./pageSq.jpg')
		},
		evenPageTex: {
			type:'t', 
			value: new THREE.TextureLoader().load('./pageSq.jpg')
		}
	}

	this.init_();
};

Page.PAGE_DIV = 20;
Page.ODD = 0;
Page.EVEN = 1;

Page.FRAGMENT_SHADER_SRC = document.getElementById('pageFragSrc').text;
Page.VERTEX_SHADER_SRC = document.getElementById('pageVertSrc').text;

Page.prototype.setPageTexture = function(tex, side) {

	if (side == Page.EVEN) {
		this.shaderMat.uniforms.evenPageTex.value = tex;
		this.shaderMat.uniforms.evenPageTex.needsUpdate = true;
	} else {
		this.shaderMat.uniforms.oddPageTex.value = tex;
		this.shaderMat.uniforms.oddPageTex.needsUpdate = true;
	}
}

Page.prototype.setVisible = function(v) {
	this.mesh.visible = v;
};

Page.prototype.init_ = function() {
	this.geo = new THREE.Geometry();

	this.bookCurve = new BookCurve(this.width,
		this.height,
		this.thick,
		true);

	for (let i=0; i < (Page.PAGE_DIV+1)*2; i++) {
		this.geo.vertices.push(new THREE.Vector3(0, 0, 0));
	}

	this.mat = new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		wireframe: true
	});
	this.mat.side = THREE.DoubleSide;


	BookUtils.makeSide({
		geo: this.geo,
		curve1: 0,
		curve2: 1,
		divs: Page.PAGE_DIV,	
	});

	this.shaderMat = new THREE.ShaderMaterial({
		side: THREE.DoubleSide,
		uniforms: this.uniforms,
		vertexShader: Page.VERTEX_SHADER_SRC,
		fragmentShader: Page.FRAGMENT_SHADER_SRC
	})
	this.mesh = new THREE.Mesh(this.geo, this.shaderMat);
	
	// this.mesh = new THREE.Mesh(this.geo, this.mat);
	
	this.updateCurve();
	this.updateGeo();
};

Page.prototype.updateCurve = function() {
	this.bookCurve.update(this.theta, this.progress);
};

Page.prototype.animateFlip= function(dir, callback) {
	this.animDirection = (dir < 0) ? -1 : 1;
	this.animating = true;

	const curr = dir < 0 ? 1 : -1;
	this.targetAnimVal = 0 - curr;

	this.setFlipValue(curr);
	this.setVisible(true);

	this.animFinishedCallback = callback;

};

Page.prototype.updateGeo = function() {

	let u = 0;
	let pt;
	for (let i=0; i < (Page.PAGE_DIV + 1)*2; i++) {
		u = (i % (Page.PAGE_DIV+1)) / Page.PAGE_DIV;
		pt = this.bookCurve.getPointAt(u);
		this.geo.vertices[i].x = pt.x;
		this.geo.vertices[i].y = pt.y;

		if (i < Page.PAGE_DIV+1) {
			this.geo.vertices[i].z = -this.height/2;
		} else {
			this.geo.vertices[i].z = this.height/2;
		}
	}
	this.geo.verticesNeedUpdate = true;
};

/**
 * Input ranges from -1 to 1
 * @param {number} f
 */
Page.prototype.setFlipValue = function(f) {
	this.flip = f;
	this.theta = this.maxTheta * f;
	this.geoDirty = true;
};

Page.prototype.isAnimating = function() {
	return this.animating;
};

Page.prototype.setStatus = function(t, p) {
	this.theta = t;
	this.progress = p;
	this.geoDirty = true;
};

Page.prototype.setOpen = function(o) {
	this.maxTheta = o;
	this.geoDirty = true;
}

Page.prototype.setTheta = function(t) {
	this.theta = t;
	this.geoDirty = true;
};

Page.prototype.setProgress = function(p) {
	this.progress = p;
	this.geoDirty = true;
};

Page.prototype.setTexture = function(tex) {
	this.mat.setValues({
		map: tex,
		color: 0xFFFFFF,
		wireframe: false,
	});
	this.mat.needsUpdate = true;	
};

Page.prototype.update = function(delta) {

	if (this.animating) {
		const newF = this.flip += (this.animDirection * delta);
		this.setFlipValue(newF);

		if (this.flip < -1 || this.flip > 1) {
			this.animating = false;
			this.setVisible(false);

			if (this.animFinishedCallback != null) {
				this.animFinishedCallback();
			}
		}
	}

	if (this.geoDirty) {
		this.updateCurve();
		this.updateGeo();
		this.geoDirty = false;
	}
};
