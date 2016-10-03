var App = require('./src/index');
var THREE = require('three');

var NumberNode = require('./src/node_modules/nodeObjects/NumberNode');
var TimeNode = require('./src/node_modules/nodeObjects/TimeNode');
var MathNode = require('./src/node_modules/nodeObjects/MathNode');

var randomFromArray = require('./src/node_modules/utils/array/randomFromArray');

var hitTest = require('threejs-hittest');
hitTest.rayCaster.linePrecision = 0.2;

function onAppInit() {
	var scene = app.view.scene;

	var total = 10;
	var range = 5;
	var rangeHalf = range * 0.5;
	var balls = [];
	app.view.camera.position.z = 20;
	app.view.camera.position.y = 0;
	var cursorHome = new THREE.Vector3(-3, 5, 0);
	var cursor = cursorHome.clone();

	function spawn(Class, newLine) {
		if(newLine) {
			cursor.y -= 1.5;
			cursor.x = cursorHome.x;
		}
		var instance = new Class();
		scene.add(instance);
		instance.position.copy(cursor);
		cursor.x += 3;
		return instance;
	}

	for(var i = 0; i < 40; i++) {
		var time = spawn(TimeNode, true);
		var thousand = spawn(NumberNode.bind(null, 0.001));
		var divide = spawn(MathNode.bind(null, '*'), true);
		var result = spawn(NumberNode.bind(null), true);
		var sin = spawn(MathNode.bind(null, 'sin'), true);
		var cos = spawn(MathNode.bind(null, 'cos'));
		var resultSin = spawn(NumberNode.bind(null), true);
		var resultCos = spawn(NumberNode.bind(null));
		var sum = spawn(MathNode.bind(null, '+'), true);
		var result2 = spawn(NumberNode.bind(null), true);
		var min = spawn(NumberNode.bind(null, -(Math.random() * 0.5 + 0.5)));
		var max = spawn(NumberNode.bind(null, Math.random() * 0.5 + 0.5));
		var clamp = spawn(MathNode.bind(null, 'clamp'), true);
		var plusplus = spawn(MathNode.bind(null, '++'), true);
		var result4 = spawn(NumberNode.bind(null), true);
		app.connectionManager.connect(time.outputs[0], divide.inputs[0]);
		app.connectionManager.connect(thousand.outputs[0], divide.inputs[1]);
		app.connectionManager.connect(divide.outputs[0], result.inputs[0]);
		app.connectionManager.connect(result.outputs[0], sin.inputs[0]);
		app.connectionManager.connect(result.outputs[0], cos.inputs[0]);
		app.connectionManager.connect(sin.outputs[0], resultSin.inputs[0]);
		app.connectionManager.connect(cos.outputs[0], resultCos.inputs[0]);
		app.connectionManager.connect(sin.outputs[0], sum.inputs[0]);
		app.connectionManager.connect(cos.outputs[0], sum.inputs[1]);
		app.connectionManager.connect(sum.outputs[0], result2.inputs[0]);
		app.connectionManager.connect(result2.outputs[0], clamp.inputs[0]);
		app.connectionManager.connect(min.outputs[0], clamp.inputs[1]);
		app.connectionManager.connect(max.outputs[0], clamp.inputs[2]);
		app.connectionManager.connect(clamp.outputs[0], plusplus.inputs[0]);
		app.connectionManager.connect(plusplus.outputs[0], result4.inputs[0]);
		if(i % 6 === 0) {
			cursorHome.x += 8;
			cursor.copy(cursorHome);
		}
	}
}

var app = new App(onAppInit);

window.app = app;
