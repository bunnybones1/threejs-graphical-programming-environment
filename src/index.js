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

var clipspaceToWorld = require('utils/clipspaceToWorld');
var decorateMethodAfter = require('utils/decorateMethodAfter');

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
	var childrenWithOnEnterFrame = [];
	var screenSize = view.size;
	var camera = view.camera;
	decorateMethodAfter(view.scene, 'add', function(child) {
		if(child.onEnterFrame) {
			childrenWithOnEnterFrame.push(child);
		}
	});

	var contextMenuManager = new ContextMenuManager(this);
	var connectionManager = new ConnectionManager(this);
	var selectionManager = new SelectionManager(this);
	var selectionManager = new SelectionManager(this);

	var attachmentCursor = null;
	var attachmentOrigin = null;
	function startDrag(x, y) {
		x = x / screenSize.x * 2 - 1;
		y = y / screenSize.y * 2 - 1;
		var hits = hitTest(
			x,
			y,
			camera,
			sceneChildren,
			true
		).filter(function(hit) {
			return !hit.object.ignoreHitTest;
		});
		if(hits.length > 0) {
			var obj = hits[0].object;
			if(obj.isAttachmentPoint) {
				var original = obj;
				obj = original.clone();
				obj.connections = [];
				obj.material.transparent = true;
				view.scene.add(obj);
				obj.position.applyMatrix4(original.parent.matrixWorld);
				attachmentCursor = obj;
				attachmentCursor.temporary = true;
				attachmentOrigin = original;
				connectionManager.connect(original, obj);
			}
			selectionManager.selectObject(obj);
			onDownWorldCoord.copy(hits[0].point);
			onDownClipSpaceCoord.copy(onDownWorldCoord).project(camera);
		} else {
			contextMenuManager.beginWait(clipspaceToWorld(x, y, camera));
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
		var hits = hitTest(
			x / screenSize.x * 2 - 1,
			y / screenSize.y * 2 - 1,
			camera,
			sceneChildren,
			true
		).filter(function(hit) {
			return !hit.object.ignoreHitTest;
		});
		if(attachmentCursor) {
			var connected = false;
			hits = hits.filter(function(hit) {
				return hit.object !== attachmentCursor;
			});
			if(hits.length === 0) {
				connectionManager.disconnect(attachmentOrigin, attachmentCursor);
				attachmentCursor.parent.remove(attachmentCursor);
			}
			for (var i = 0; i < hits.length && !connected; i++) {
				var hit = hits[i];
				var obj = hit.object;
				if(obj.isAttachmentPoint && obj !== attachmentCursor) {
					connectionManager.disconnect(attachmentCursor, attachmentOrigin);
					attachmentCursor.parent.remove(attachmentCursor);
					connectionManager.connect(attachmentOrigin, obj);
					connected = true;
				}
			}
			//interact with context menu
			attachmentCursor = null;
			attachmentOrigin = null;
		}
		for (var i = 0; i < hits.length; i++) {
			var hit = hits[i];
			var obj = hit.object;
			if(obj.nodes) {
				connectionManager.disconnect(obj.nodes[0], obj.nodes[1]);
			}
		}
		contextMenuManager.close();
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

	function onEnterFrame() {
		childrenWithOnEnterFrame.forEach(function(child){
			child.onEnterFrame();
		});
	}
	view.view.renderManager.onEnterFrame.add(onEnterFrame);

	this.view = view;
	this.connectionManager = connectionManager;
	this.onInit();
};

module.exports = App;
