var App = require('./src/index');
var THREE = require('three');

var TestNode = require('./src/node_modules/nodeObjects/TestNode');

var randomFromArray = require('./src/node_modules/utils/array/randomFromArray');

var hitTest = require('threejs-hittest');
hitTest.rayCaster.linePrecision = 0.002;

function onAppInit() {
	var scene = app.view.scene;

	var total = 10;
	var range = 5;
	var rangeHalf = range * 0.5;
	var balls = [];
	app.view.camera.position.y = 0;
	for (var i = 0; i < total; i++) {
		var ball = new TestNode(~~(Math.random() * 5 + 1), ~~(Math.random() * 3 + 1));
		ball.position.set(
			Math.random() * range - rangeHalf,
			Math.random() * range - rangeHalf,
			Math.random() * range - rangeHalf - 10
		);
		balls.push(ball);
		scene.add(ball);
	}

	var totalLines = 10;
	while(totalLines > 0) {
		var fromObj = balls[~~(Math.random() * balls.length)];
		var toObj = balls[~~(Math.random() * balls.length)];
		if(fromObj === toObj) continue;

		fromObj = randomFromArray(fromObj.outputs);
		toObj = randomFromArray(toObj.inputs);

		if(app.connectionManager.connect(fromObj, toObj)) {
			totalLines--;
		}
	}
}

var app = new App(onAppInit);
