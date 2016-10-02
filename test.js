var App = require('./src/index');
var THREE = require('three');

var hitTest = require('threejs-hittest');
hitTest.rayCaster.linePrecision = 0.002;

var app = new App();

var scene = app.view.scene;

var total = 1000;
var range = 100;
var rangeHalf = range * 0.5;
var ballGeometry = new THREE.SphereGeometry(0.5, 32, 16);
var balls = [];
for (var i = 0; i < total; i++) {
	var ball = new THREE.Mesh(ballGeometry);
	ball.position.set(
		Math.random() * range - rangeHalf,
		Math.random() * range - rangeHalf,
		Math.random() * range - rangeHalf
	);
	balls.push(ball);
	scene.add(ball);
}

var totalLines = 100;

var lineGeometry = new THREE.BufferGeometry();
lineGeometry.addAttribute( 'position', new THREE.Float32Attribute( [ 0, 0, 0, 0, 0, 1 ], 3 ) );
var color = new THREE.Color(1, 1, 1);
var lineMaterial = new THREE.LineBasicMaterial( { color: color } );
while(totalLines > 0) {
	var fromObj = balls[~~(Math.random() * balls.length)];
	var toObj = balls[~~(Math.random() * balls.length)];
	if(fromObj === toObj) return;

	var line = new THREE.Line( lineGeometry, lineMaterial );
	scene.add( line );
	line.position.copy(fromObj.position);
	line.lookAt(toObj.position);
	var delta = fromObj.position.clone().sub(toObj.position);
	line.scale.multiplyScalar(delta.length());
	totalLines--;
}
