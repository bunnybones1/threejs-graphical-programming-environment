THREE = require('three');
var View = require('InteractiveView');
var Keyboard = require('game-keyboard');
var keymap = require('game-keyboard/key_map').US;
var hitTest = require('threejs-hittest');
var ContextMenuManager = require('ContextMenuManager');
var ConnectionManager = require('ConnectionManager');
var SelectionManager = require('SelectionManager');
var loadFont = require('load-bmfont');
var Label = require('nodeObjects/Label');

function App(onInit) {
	this.start = this.start.bind(this);
	this.onInit = onInit;
	this.loadFont();
}

App.prototype.loadFont = function() {
	var start = this.start;
	loadFont('assets/font/Roboto-msdf.json', function (err, font) {
		if (err) throw err;
		THREE.ImageUtils.loadTexture('assets/font/Roboto-msdf.png', undefined, function (texture) {
			Label.initFont(font, texture);
			start();
		});
	});
};

App.prototype.start = function() {
	var keyboard = new Keyboard(keymap);
	var view = new View();

	var sceneChildren = view.scene.children;
	var screenSize = view.size;
	var camera = view.camera;

	var contextMenuManager = new ContextMenuManager(this);
	var connectionManager = new ConnectionManager(this);
	var selectionManager = new SelectionManager(this);
	var selectionManager = new SelectionManager(this);

	var attachmentCursor = null;
	var attachmentOrigin = null;
	function startDrag(x, y) {
		var hits = hitTest(
			x / screenSize.x * 2 - 1,
			y / screenSize.y * 2 - 1,
			camera,
			sceneChildren,
			true
		);
		if(hits.length > 0) {
			var obj = hits[0].object;
			if(obj.isAttachmentPoint) {
				var original = obj;
				obj = original.clone();
				obj.connections = [];
				obj.material.opacity = 0.5;
				obj.material.transparent = true;
				view.scene.add(obj);
				obj.position.applyMatrix4(original.parent.matrixWorld);
				attachmentCursor = obj;
				attachmentOrigin = original;
				connectionManager.connect(original, obj);
			}
			selectionManager.selectObject(obj);
			onDownWorldCoord.copy(hits[0].point);
			onDownClipSpaceCoord.copy(onDownWorldCoord).project(camera);
		} else {
			contextMenuManager.beginWait();
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

		selectionManager.selected.forEach(function(item) {
			item.position.copy(item.positionBackup);
			item.position.project(camera);
			item.position.x -= screenDelta.x;
			item.position.y -= screenDelta.y;
			item.position.unproject(camera);
		});
		if(screenDelta.length() > 0.01) {
			contextMenuManager.abortWait();
		}
	}
	function stopDrag(x, y) {
		// debugger;
		selectionManager.unselectAll();
		contextMenuManager.abortWait();
		if(attachmentCursor) {
			var hits = hitTest(
				x / screenSize.x * 2 - 1,
				y / screenSize.y * 2 - 1,
				camera,
				sceneChildren,
				true
			);
			var connected = false;
			hits = hits.filter(function(hit) {
				return hit.object !== attachmentCursor;
			});
			if(hits.length === 0) {
				connectionManager.disconnect(attachmentOrigin, attachmentCursor);
				attachmentCursor.parent.remove(attachmentCursor);
			}
			while(hits.length > 0 && !connected) {
				var hit = hits.shift();
				var obj = hit.object;
				if(obj.isAttachmentPoint && obj !== attachmentCursor) {
					connectionManager.disconnect(attachmentCursor, attachmentOrigin);
					attachmentCursor.parent.remove(attachmentCursor);
					connectionManager.connect(attachmentOrigin, obj);
					connected = true;
				}
			}
			attachmentCursor = null;
			attachmentOrigin = null;
		}
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
	this.connectionManager = connectionManager;
	this.onInit();
};

module.exports = App;
