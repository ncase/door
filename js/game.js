Math.TAU = Math.PI*2;

///// LOAD IMAGES /////

var assetsCallback;
var onLoadAssets = function(callback){
	assetsCallback = callback;
	if(assetsLeft==0) assetsCallback();
};
var assetsLeft = 0;
var onImageLoaded = function(){
	assetsLeft--;
	if(assetsLeft==0) assetsCallback();
};
var images = {};
function addAsset(name,src){
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onImageLoaded;
	images[name].src = src;
}

//////////////

function Level(config){

	var self = this;

	self.circles = config.circles;
	self.player = new Peep(config.player,self);
	self.key = new DoorKey(config.key, self);
	self.door = new Door(config.door, self);
	self.clock = new Clock(config.countdown, self);

	self.canvas = config.canvas;
	self.ctx = self.canvas.getContext('2d');
	self.width = self.canvas.width;
	self.height = self.canvas.height - 80;

	self.pathCanvas = document.createElement("canvas");
	self.pathCanvas.width = self.width;
	self.pathCanvas.height = self.height;
	self.pathContext = self.pathCanvas.getContext('2d');
	self.DRAW_PATH = false;

	self.keyCollected = false;
	self.update = function(){
		
		self.player.update();
		self.key.update();

		var output = self.door.update();
		if(output=="END_LEVEL"){
			self.ctx.clearRect(0,self.height,self.canvas.width,80);
		}else{
			self.clock.update();
		}

		self.recordFrame();

	};

	self.drawPathLastPoint = null;
	self.draw = function(){

		var ctx = self.ctx;

		// Clear
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,self.width,self.height);

		// Draw shadows
		var objects = [self.player,self.key,self.door];
		for(var i=0;i<objects.length;i++){
			objects[i].drawShadow(ctx);
		}

		// Draw circles
		ctx.fillStyle = '#333';
		for(var i=0;i<self.circles.length;i++){
			var c = self.circles[i];
			if(c.invisible) continue;
			ctx.beginPath();
			ctx.arc(c.x, c.y, c.radius, 0, Math.TAU, false);
			ctx.fill();
		}

		// Draw Peep, Key, Door in depth
		objects.sort(function(a,b){ return a.y - b.y; });
		for(var i=0;i<objects.length;i++){
			objects[i].draw(ctx);
		}

		// Draw path?
		if(self.DRAW_PATH){
			ctx.drawImage(self.pathCanvas,0,0);

			if(!self.drawPathLastPoint){
				self.drawPathLastPoint = {
					x: self.player.x-0.1,
					y: self.player.y
				};
			}

			var pctx = self.pathContext;
			pctx.beginPath();
			pctx.strokeStyle = "#cc2727";
			pctx.lineWidth = 10;
			pctx.lineCap = "round";
			pctx.lineJoin = "round";
			pctx.moveTo(self.drawPathLastPoint.x, self.drawPathLastPoint.y);
			pctx.lineTo(self.player.x, self.player.y);
			pctx.stroke();
	
			self.drawPathLastPoint = {
				x: self.player.x,
				y: self.player.y
			};

		}

		// CLOCK
		ctx.clearRect(0,self.height,self.canvas.width,80);
		if(!self.NO_CLOCK) self.clock.draw(ctx);

	};

	self.frames = [];
	self.recordFrame = function(){
		
		var frame = {
			player:{
				x: self.player.x,
				y: self.player.y,
				sway: self.player.sway,
				bounce: self.player.bounce,
				frame: self.player.frame,
				direction: self.player.direction
			},
			key:{
				hover: self.key.hover
			},
			door:{
				frame: self.door.frame
			},
			keyCollected: self.keyCollected
		};

		self.frames.push(frame);

	}
	self.playbackFrame = function(frameIndex){

		var frame = self.frames[frameIndex];

		self.player.x = frame.player.x;
		self.player.y = frame.player.y;
		self.player.sway = frame.player.sway;
		self.player.bounce = frame.player.bounce;
		self.player.frame = frame.player.frame;
		self.player.direction = frame.player.direction;

		self.key.hover = frame.key.hover;
		self.door.frame = frame.door.frame;

		self.keyCollected = frame.keyCollected;

		self.NO_CLOCK = true;
		self.draw();

	}

	self.clear = function(){
		var ctx = self.ctx;
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
	}

	self.onlyPath = function(){
		self.clear();
		self.ctx.drawImage(self.pathCanvas,0,0);
	}

}

//////////////

function Clock(countdown,level){

	var self = this;
	self.level = level;
	self.framePerTick = 30/countdown;

	var enterSide = null;
	var exitSide = null;

	self.update = function(){

		// THIS IS TOTALLY A HACK, JUST FOR LEVEL 2
		// SUBTLY CHEAT - IT'S IMPOSSIBLE TO SOLVE IT THE WRONG WAY

		if(CURRENT_LEVEL==1){
			if(level.keyCollected){
				if(!exitSide && Math.abs(level.player.x-150)>30){
					exitSide = (level.player.x<150) ? "left" : "right";
				}
			}else{
				if(!enterSide && level.player.y<150){
					enterSide = (level.player.x<150) ? "left" : "right";
				}
			}
			if(exitSide && enterSide){
				if(exitSide == enterSide){
					self.frame += self.framePerTick*0.7;
				}
			}
		}

		// Normal update

		self.frame += self.framePerTick;
		if(self.frame>=30){
			reset();
		}

	};

	self.frame = 0;
	self.draw = function(ctx){

		ctx.save();
		ctx.translate(level.width/2,level.height+40);

		var f = Math.floor(self.frame);
		var sw = 82;
		var sh = 82;
		var sx = (f*sw) % images.clock.width;
		var sy = sh*Math.floor((f*sw)/images.clock.width);
		ctx.drawImage(images.clock, sx,sy,sw,sh, -30,-30,60,60);
		ctx.restore();

	};

}

function DoorKey(config,level){

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;

	self.hover = 0;
	self.update = function(){

		if(level.keyCollected) return;

		self.hover += 0.07;

		var dx = self.x-level.player.x;
		var dy = self.y-level.player.y;
		var distance = Math.sqrt(dx*dx/4 + dy*dy);
		if(distance<5){
			level.keyCollected = true;
		}

	};

	self.draw = function(ctx){

		if(level.keyCollected) return;

		ctx.save();
		ctx.translate(self.x, self.y-20-Math.sin(self.hover)*5);
		ctx.scale(0.7,0.7);
		ctx.drawImage(images.key,-23,-14,47,28);
		ctx.restore();

	};
	self.drawShadow = function(ctx){

		if(level.keyCollected) return;

		ctx.save();
		ctx.translate(self.x,self.y);
		ctx.scale(0.7,0.7);

		var scale = 1-Math.sin(self.hover)*0.5;
		ctx.scale(1*scale,0.3*scale);
		ctx.beginPath();
		ctx.arc(0, 0, 15, 0, Math.TAU, false);
		ctx.fillStyle = '#bbb';
		ctx.fill();
		ctx.restore();

	};

}

function Door(config,level){

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;

	self.update = function(){

		if(level.keyCollected && self.frame<10){
			self.frame += 0.5;
		}

		if(level.keyCollected){
			var dx = self.x-level.player.x;
			var dy = self.y-level.player.y;
			var distance = Math.sqrt(dx*dx/25 + dy*dy);
			if(distance<6){
				next();
				return "END_LEVEL";
			}
		}

	};

	self.frame = 0;
	self.draw = function(ctx){

		ctx.save();
		ctx.translate(self.x,self.y);
		ctx.scale(0.7,0.7);

		var f = Math.floor(self.frame);
		var sw = 68;
		var sh = 96;
		var sx = (f*sw) % images.door.width;
		var sy = sh*Math.floor((f*sw)/images.door.width);
		var dx = -34;
		var dy = -91;
		ctx.drawImage(images.door, sx,sy,sw,sh, dx,dy,sw,sh);
		ctx.restore();

	};
	self.drawShadow = function(ctx){

		ctx.save();
		ctx.translate(self.x,self.y);
		ctx.scale(0.7,0.7);
		ctx.scale(1,0.2);
		ctx.beginPath();
		ctx.arc(0, 0, 30, 0, Math.TAU, false);
		ctx.fillStyle = '#bbb';
		ctx.fill();
		ctx.restore();

	};

}

//////////////

function Peep(config,level){

	var self = this;
	self.level = level;

	self.x = config.x;
	self.y = config.y;
	self.vel = {x:0,y:0};
	self.frame = 0;
	self.direction = 1;

	self.update = function(){

		// Keyboard

		var dx = 0;
		var dy = 0;

		if(Key.left) dx-=1;
		if(Key.right) dx+=1;
		if(Key.up) dy-=1;
		if(Key.down) dy+=1;

		var dd = Math.sqrt(dx*dx+dy*dy);
		if(dd>0){
			self.vel.x += (dx/dd) * 2;
			self.vel.y += (dy/dd) * 2;
		}

		if(Key.left) self.direction=-1;
		if(Key.right) self.direction=1;

		if(Key.left || Key.right || Key.up || Key.down){
			//if(self.frame==0) bounce=0.8;
			self.frame++;
			if(self.frame>8) self.frame=1;
		}else{
			if(self.frame>0) bounce=0.8;
			self.frame = 0;
		}

		// Velocity

		self.x += self.vel.x;
		self.y += self.vel.y;
		self.vel.x *= 0.7;
		self.vel.y *= 0.7;

		// Dealing with colliding into border
		if(self.x<0) self.x=0;
		if(self.y<0) self.y=0;
		if(self.x>level.width) self.x=level.width;
		if(self.y>level.height) self.y=level.height;

		// Dealing with collision of circles
		// Hit a circle? Figure out how deep, then add that vector away from the circle.

		for(var i=0;i<level.circles.length;i++){

			var circle = level.circles[i];

			// Hit circle?
			var dx = self.x-circle.x;
			var dy = self.y-circle.y;
			var distance = Math.sqrt(dx*dx + dy*dy);
			var overlap = (circle.radius+5) - distance;
			if(overlap>0){
				
				// Yes, I've been hit, by "overlap" pixels.
				// Push me back
				var ux = dx/distance;
				var uy = dy/distance;
				var pushX = ux*overlap;
				var pushY = uy*overlap;
				self.x += pushX;
				self.y += pushY;

			}

		}

		// Bouncy & Sway
		self.sway += swayVel;
		swayVel += ((-self.vel.x*0.08)-self.sway)*0.2;
		swayVel *= 0.9;
		self.bounce += bounceVel;
		bounceVel += (1-self.bounce)*0.2;
		bounceVel *= 0.9;

	};

	self.bounce = 1;
	var bounceVel = 0;
	self.sway = 0;
	var swayVel = 0;
	var bouncy = [0.00, 0.25, 1.00, 0.90, 0.00, 0.25, 1.00, 0.90, 0.00];
	self.draw = function(ctx){
		
		var x = self.x;
		var y = self.y;

		// DRAW GOOFY BOUNCY DUDE //
		
		y += -4*bouncy[self.frame];

		ctx.save();
		ctx.translate(x,y);
		ctx.scale(0.5,0.5);

		ctx.rotate(self.sway);
		ctx.scale(self.direction,1);///anim.stretch, anim.stretch);
		ctx.scale(1/self.bounce, self.bounce);
		//ctx.rotate(anim.rotate*0.15);
		ctx.drawImage(images.peep,-25,-100,50,100);
		ctx.restore();

	};

	self.drawShadow = function(ctx){

		var x = self.x;
		var y = self.y;

		ctx.save();
		ctx.translate(x,y);
		ctx.scale(0.5,0.5);

		var scale = (3-bouncy[self.frame])/3;
		ctx.scale(1*scale,0.3*scale);
		ctx.beginPath();
		ctx.arc(0, 0, 20, 0, Math.TAU, false);
		ctx.fillStyle = '#bbb';
		ctx.fill();
		ctx.restore();

	};

}

//// UPDATE & RENDER ////

window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };

window.onload = function(){

	addAsset("peep","assets/peep.png");
	addAsset("key","assets/key.png");
	addAsset("door","assets/door.png");
	addAsset("clock","assets/clock.png");

	onLoadAssets(function(){
		
		reset();

		var frameDirty = false;
		function update(){

			if(STAGE==1){
				if(level){
					level.update();
					frameDirty = true;
				}
			}else if(STAGE==2||STAGE==3){
				frameDirty = true;
			}

		}
		function render(){

			if(STAGE==1){

				if(level){
					level.draw();
				}

				frameDirty = false;

			}else if(STAGE==2){

				rewindLevel.playbackFrame(rewindFrame);
				rewindFrame--;
				if(rewindFrame<0){
					CURRENT_LEVEL--;
					if(CURRENT_LEVEL>=0){
						startRewind();
					}else{
						STAGE = 3;
						CURRENT_LEVEL = 0;
						startPlayback();
					}
				}

			}else if(STAGE==3){

				rewindLevel.playbackFrame(rewindFrame);
				rewindFrame++;
				if(rewindFrame>=rewindLevel.frames.length){
					CURRENT_LEVEL++;
					if(CURRENT_LEVEL<3){
						startPlayback();
					}else{
						iHeartYou();
						STAGE = 4;
					}
				}

				frameDirty = false;

			}

		}

		setInterval(update,1000/30);
		(function animloop(){
			requestAnimFrame(animloop);
			if(frameDirty) render();
		})();

	});

};

var STAGE = 1;
// 0 - Intro
// 1 - Play levels in order
// 2 - Rewind levels
// 3 - Replay levels with path
// 4 - I HEART YOU
// 5 - End screen

function next(){
	CURRENT_LEVEL++;
	if(CURRENT_LEVEL<LEVEL_CONFIG.length){

		var lvl = new Level(LEVEL_CONFIG[CURRENT_LEVEL]);
		levelObjects[CURRENT_LEVEL] = lvl;
		window.level = null;
		setTimeout(function(){
			window.level = lvl;
		},500);

	}else{
		level = null;
		STAGE = 2;
		CURRENT_LEVEL = 2;
		startRewind();
	}
}

function iHeartYou(){
	
	for(var i=0; i<levelObjects.length; i++) {
		levelObjects[i].onlyPath();
	}

	document.getElementById("canvas_container").style.backgroundPosition = "0px -390px";
	document.getElementById("screen_two").style.background = "#000";
	
	var can_cont_text = document.getElementById("canvas_container_text");

	var vtext = document.getElementById("valentines_text");
	vtext.style.display = "block";
	document.getElementById("valentines_from").textContent = "nicky";
	document.getElementById("valentines_to").textContent = "(recipient)";

	setTimeout(function(){
		vtext.style.letterSpacing = "3px";
	},10);

	// After 9 seconds, swipe down to CREDITS.
	// No replay. Fuck it.

}

var rewindFrame = 0;
var rewindLevel = null;
function startRewind(){
	rewindLevel = levelObjects[CURRENT_LEVEL];
	rewindFrame = rewindLevel.frames.length-1;
}
function startPlayback(){
	rewindLevel = levelObjects[CURRENT_LEVEL];
	rewindLevel.DRAW_PATH = true;
	rewindFrame = 0;
}

var levelObjects = [];
var CURRENT_LEVEL = 0;
function reset(){
	var lvl = new Level(LEVEL_CONFIG[CURRENT_LEVEL]);
	levelObjects[CURRENT_LEVEL] = lvl;
	if(window.level) window.level.clear();
	window.level = null;
	setTimeout(function(){
		window.level = lvl;
	},500);
}