var standardProgram;

function initShaders() {
	var fragmentShader = getShader(gl, "frag-lighting-fs");
	var vertexShader = getShader(gl, "frag-lighting-vs");
	standardProgram = gl.createProgram();
	gl.attachShader(standardProgram, vertexShader);
	gl.attachShader(standardProgram, fragmentShader);
	gl.linkProgram(standardProgram);

	if (!gl.getProgramParameter(standardProgram, gl.LINK_STATUS)) {
		alert("Could not initialise standard shader");
	}

	gl.useProgram(standardProgram);

	standardProgram.vertexAttribute = gl.getAttribLocation(standardProgram, "aPosition");
	gl.enableVertexAttribArray(standardProgram.vertexPosition);

	standardProgram.coordinateAttribute = gl.getAttribLocation(standardProgram, "aCoordinate");
	gl.enableVertexAttribArray(standardProgram.coordinateAttribute);
}

var vertexBuffer;
var coordBuffer;
var indexBuffer;

function initBuffers() {
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// just a simple square
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		// x, y
		-1.0, -1.0,
		-1.0, 1.0,
		1.0, -1.0,
		1.0, 1.0
	]), gl.STATIC_DRAW);
	vertexBuffer.itemSize = 2;
	vertexBuffer.numItems = 4;

	coordBuffer = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
	// complex coordinates of the edges of the display plane
	// do some math to get square pixels
	var aspectRatio = canvas.width / canvas.height;
	minX = -2.0 * aspectRatio;
	maxX = 2.0 * aspectRatio;
	minY = -2.0;
	maxY = 2.0;
	updateCoordinateBuffer();
	coordBuffer.itemSize = 2;
	coordBuffer.numItems = 4;

	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
		1, 0, 2,
		1, 2, 3
	]), gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = 6;
}

// this function assumes the corners are adjusted for aspect ratio
function updateCoordinateBuffer() {
	gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		minX, minY,
		minX, maxY,
		maxX, minY,
		maxX, maxY
	]), gl.DYNAMIC_DRAW);
	document.getElementById('center').textContent = 'Center at ' + ((minX + maxX) / 2).toFixed(4) + ' + ' + ((minY + maxY) / 2).toFixed(4) + 'i';
}

function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(standardProgram.vertexAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
	gl.vertexAttribPointer(standardProgram.coordinateAttribute, coordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
}

var minX, minY, maxX, maxY;
var lastFrame = -1;
var keysDown = {};

// keyboard handlers
function handleKeyDown(event) {
	keysDown[event.keyCode] = true;
}

function handleKeyUp(event) {
	keysDown[event.keyCode] = false;
}

function updateCoordinates() {
	// first, figure out how much we want to move the camera
	// using a static value for that would suck at high zoom levels
	// find out how long it's been since the last update
	var current = new Date().getTime();
	if(lastFrame == -1)
		lastFrame = current;
	// we want the time in seconds for simplicity
	var elapsed = (current - lastFrame) / 1000.0;
	lastFrame = current;

	var step = (maxX - minX) * 0.5 * elapsed;
	var xZoomStep = (maxX - minX) * 0.3 * elapsed;
	var yZoomStep = (maxY - minY) * 0.3 * elapsed;

	if(keysDown[87]) {
		// W, scroll up
		maxY += step;
		minY += step;
	}

	if(keysDown[83]) {
		// S, scroll down
		maxY -= step;
		minY -= step;
	}

	if(keysDown[65]) {
		// A, scroll left
		maxX -= step;
		minX -= step;
	}

	if(keysDown[68]) {
		// D, scroll right
		maxX += step;
		minX += step;
	}

	if(keysDown[81]) {
		// Q, zoom in
		maxX += xZoomStep;
		minX -= xZoomStep;
		maxY += yZoomStep;
		minY -= yZoomStep;
	}

	if(keysDown[69]) {
		// E, zoom out
		maxX -= xZoomStep;
		minX += xZoomStep;
		maxY -= yZoomStep;
		minY += yZoomStep;
	}

	if(keysDown[82]) {
		// R, reset
		var aspectRatio = canvas.width / canvas.height;
		maxX = 2.0 * aspectRatio;
		minX = -2.0 * aspectRatio;
		maxY = 2.0;
		minY = -2.0;
	}

	updateCoordinateBuffer();
}

function tick() {
	requestAnimFrame(tick);
	updateCoordinates();
	drawScene();
	trackFPS('fps-counter');
}

function startGL() {
	var canvas = document.getElementById('canvas');
	initGL(canvas);
	initShaders();
	initBuffers();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;

	tick();
}