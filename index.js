Math.TAU = Math.PI*2;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
addAsset("peep","peep.png");

//////////////

function Peep(){

	var self = this;

	self.x = window.innerWidth/2;
	self.y = window.innerHeight/2;
	self.vel = {x:0,y:0};
	self.frame = 0;
	self.direction = 1;

	self.update = function(){

		if(Key.left) self.vel.x -= 4;
		if(Key.right) self.vel.x += 4;
		if(Key.up) self.vel.y -= 3;
		if(Key.down) self.vel.y += 3;

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

		self.x += self.vel.x;
		self.y += self.vel.y;
		self.vel.x *= 0.7;
		self.vel.y *= 0.7;

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

		var scale = (3-bouncy[self.frame])/3;
		ctx.scale(1*scale,0.3*scale);
		ctx.beginPath();
		ctx.arc(0, 0, 20, 0, Math.TAU, false);
		ctx.fillStyle = 'rgba(0,0,0,0.2)';
		ctx.fill();
		ctx.restore();


		// DRAW GOOFY BOUNCY FUCKER //
		
		y += -8*bouncy[self.frame];

		sway += swayVel;
		swayVel += ((-self.vel.x*0.04)-sway)*0.2;
		swayVel *= 0.9;
		bounce += bounceVel;
		bounceVel += (1-bounce)*0.2;
		bounceVel *= 0.9;

		ctx.save();
		ctx.translate(x,y);
		ctx.rotate(sway);
		ctx.scale(self.direction,1);///anim.stretch, anim.stretch);
		ctx.scale(1/bounce, bounce);
		//ctx.rotate(anim.rotate*0.15);
		ctx.drawImage(images.peep,-25,-100,50,100);
		ctx.restore();

	};

}

var peep = new Peep();

//// UPDATE & RENDER ////

function update(){
	peep.update();
}

function render(){
	//ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.clearRect(peep.x-150,peep.y-200,300,300);
	peep.draw(ctx);
}

window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };

onLoadAssets(function(){
	setInterval(update,1000/30);
	(function animloop(){
		requestAnimFrame(animloop);
		render();
	})();
});