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
	self.canvas = config.canvas;
	self.ctx = self.canvas.getContext('2d');

	self.update = function(){
		self.player.update();
	};

	self.draw = function(){

		var ctx = self.ctx;

		// Clear
		ctx.clearRect(0,0,canvas.width,canvas.height);

		// Draw circles
		ctx.fillStyle = '#333';
		for(var i=0;i<self.circles.length;i++){
			var c = self.circles[i];
			if(c.invisible) continue;
			ctx.beginPath();
			ctx.arc(c.x, c.y, c.radius, 0, Math.TAU, false);
			ctx.fill();
		}

		// Draw Peep
		self.player.draw(ctx);

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
		if(self.x>level.canvas.width) self.x=level.canvas.width;
		if(self.y>level.canvas.height) self.y=level.canvas.height;

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


	};

	var bounce = 1;
	var bounceVel = 0;
	var sway = 0;
	var swayVel = 0;
	var bouncy = [0.00, 0.25, 1.00, 0.90, 0.00, 0.25, 1.00, 0.90, 0.00];
	self.draw = function(ctx){
		
		var x = self.x;
		var y = self.y;

		// DRAW SHADOW //

		ctx.save();
		ctx.translate(x,y);
		ctx.scale(0.5,0.5);

		var scale = (3-bouncy[self.frame])/3;
		ctx.scale(1*scale,0.3*scale);
		ctx.beginPath();
		ctx.arc(0, 0, 20, 0, Math.TAU, false);
		ctx.fillStyle = 'rgba(0,0,0,0.2)';
		ctx.fill();
		ctx.restore();


		// DRAW GOOFY BOUNCY FUCKER //
		
		y += -4*bouncy[self.frame];

		sway += swayVel;
		swayVel += ((-self.vel.x*0.08)-sway)*0.2;
		swayVel *= 0.9;
		bounce += bounceVel;
		bounceVel += (1-bounce)*0.2;
		bounceVel *= 0.9;

		ctx.save();
		ctx.translate(x,y);
		ctx.scale(0.5,0.5);

		ctx.rotate(sway);
		ctx.scale(self.direction,1);///anim.stretch, anim.stretch);
		ctx.scale(1/bounce, bounce);
		//ctx.rotate(anim.rotate*0.15);
		ctx.drawImage(images.peep,-25,-100,50,100);
		ctx.restore();

	};

}

//// UPDATE & RENDER ////

window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };

window.onload = function(){

	addAsset("peep","peep.png");

	onLoadAssets(function(){
		
		window.level = new Level(LEVEL_CONFIG);

		function update(){
			level.update();
		}
		function render(){
			level.draw();
		}

		setInterval(update,1000/30);
		(function animloop(){
			requestAnimFrame(animloop);
			render();
		})();

	});

};