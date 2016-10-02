THREE = require('three');
var View = require('InteractiveView');
var Keyboard = require('game-keyboard');
var keymap = require('game-keyboard/key_map').US;
var hitTest = require('threejs-hittest');

function App() {
	var keyboard = new Keyboard(keymap);
	var view = new View();

	var sceneChildren = view.scene.children;
	var screenSize = view.size;
	var camera = view.camera;
	var selected = [];

	function selectObject(item) {
		selected.push(item);
		if(!item.positionBackup) {
			item.positionBackup = new THREE.Vector3();
		}
		item.positionBackup.copy(item.position);
	}

	function startDrag(x, y) {
		var hits = hitTest(
			x / screenSize.x * 2 - 1,
			y / screenSize.y * 2 - 1,
			camera,
			sceneChildren
		);
		if(hits.length > 0) {
			selectObject(hits[0].object);
			onDownWorldCoord.copy(hits[0].point);
			onDownClipSpaceCoord.copy(onDownWorldCoord).project(camera);
		}
	}
	var screenDelta = new THREE.Vector2();
	var onDownWorldCoord = new THREE.Vector3();
	var onDownClipSpaceCoord = new THREE.Vector3();
	function moveDrag(x, y) {
		screenDelta.set(
			onDownClipSpaceCoord.x - (x / screenSize.x * 2 - 1),
			onDownClipSpaceCoord.y + (y / screenSize.y * 2 - 1)
		);

		selected.forEach(function(item) {
			item.position.copy(item.positionBackup);
			item.position.project(camera);
			item.position.x -= screenDelta.x;
			item.position.y -= screenDelta.y;
			item.position.unproject(camera);
		});
	}
	function stopDrag(x, y) {
		// debugger;
		selected.length = 0;
	}
	function hijackSignal(signal, action) {
		function conditionalHalt() {
			if(!keyboard.isPressed('space')) {
				signal.halt();
				action.apply(null, arguments);
			}
		}
		signal.add(conditionalHalt, null, 100);
	}

	hijackSignal(view.pointers.onPointerDownSignal, startDrag);
	hijackSignal(view.pointers.onPointerDragSignal, moveDrag);
	view.pointers.onPointerUpSignal.add(stopDrag, null, 100);

	this.view = view;
}

module.exports = App;
