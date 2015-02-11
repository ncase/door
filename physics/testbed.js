Math.TAU = Math.PI * 2;

var e_shapeBit = 0x0001;
var e_jointBit = 0x0002;
var e_aabbBit = 0x0004;
var e_pairBit = 0x0008;
var e_centerOfMassBit = 0x0010;

var PTM = 32;

var world = null;
var mouseJointGroundBody;
var canvas;
var context;
var myDebugDraw;        
var myQueryCallback;
var mouseJoint = null;        
var run = true;
var frameTime60 = 0;
var statusUpdateCounter = 0;
var showStats = false;        
var mouseDown = false;
var shiftDown = false;        
var mousePosPixel = {
    x: 0,
    y: 0
};
var prevMousePosPixel = {
    x: 0,
    y: 0
};        
var mousePosWorld = {
    x: 0,
    y: 0
};        
var canvasOffset = {
    x: 0,
    y: 0
};        
var viewCenterPixel = {
    x:150,
    y:150
};
var currentTest = null;

function myRound(val,places) {
    var c = 1;
    for (var i = 0; i < places; i++)
        c *= 10;
    return Math.round(val*c)/c;
}
        
function getWorldPointFromPixelPoint(pixelPoint) {
    return {                
        x: (pixelPoint.x - canvasOffset.x)/PTM,
        y: (pixelPoint.y - (canvas.height - canvasOffset.y))/PTM
    };
}

function updateMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    mousePosPixel = {
        x: evt.clientX - rect.left,
        y: canvas.height - (evt.clientY - rect.top)
    };
    mousePosWorld = getWorldPointFromPixelPoint(mousePosPixel);
}

function setViewCenterWorld(b2vecpos, instantaneous) {
    var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    var toMoveX = b2vecpos.get_x() - currentViewCenterWorld.x;
    var toMoveY = b2vecpos.get_y() - currentViewCenterWorld.y;
    var fraction = instantaneous ? 1 : 0.25;
    canvasOffset.x -= myRound(fraction * toMoveX * PTM, 0);
    canvasOffset.y += myRound(fraction * toMoveY * PTM, 0);
}

function onMouseMove(canvas, evt) {
    prevMousePosPixel = mousePosPixel;
    updateMousePos(canvas, evt);
    updateStats();
    if ( shiftDown ) {
        canvasOffset.x += (mousePosPixel.x - prevMousePosPixel.x);
        canvasOffset.y -= (mousePosPixel.y - prevMousePosPixel.y);
        draw();
    }
    else if ( mouseDown && mouseJoint != null ) {
        mouseJoint.SetTarget( new Box2D.b2Vec2(mousePosWorld.x, mousePosWorld.y) );
    }
}

function startMouseJoint() {
    
    if ( mouseJoint != null )
        return;
    
    // Make a small box.
    var aabb = new Box2D.b2AABB();
    var d = 0.001;            
    aabb.set_lowerBound(new b2Vec2(mousePosWorld.x - d, mousePosWorld.y - d));
    aabb.set_upperBound(new b2Vec2(mousePosWorld.x + d, mousePosWorld.y + d));
    
    // Query the world for overlapping shapes.            
    myQueryCallback.m_fixture = null;
    myQueryCallback.m_point = new Box2D.b2Vec2(mousePosWorld.x, mousePosWorld.y);
    world.QueryAABB(myQueryCallback, aabb);
    
    if (myQueryCallback.m_fixture)
    {
        var body = myQueryCallback.m_fixture.GetBody();
        var md = new Box2D.b2MouseJointDef();
        md.set_bodyA(mouseJointGroundBody);
        md.set_bodyB(body);
        md.set_target( new Box2D.b2Vec2(mousePosWorld.x, mousePosWorld.y) );
        md.set_maxForce( 1000 * body.GetMass() );
        md.set_collideConnected(true);
        
        mouseJoint = Box2D.castObject( world.CreateJoint(md), Box2D.b2MouseJoint );
        body.SetAwake(true);
    }
}

function onMouseDown(canvas, evt) {            
    updateMousePos(canvas, evt);
    if ( !mouseDown )
        startMouseJoint();
    mouseDown = true;
    updateStats();
}

function onMouseUp(canvas, evt) {
    mouseDown = false;
    updateMousePos(canvas, evt);
    updateStats();
    if ( mouseJoint != null ) {
        world.DestroyJoint(mouseJoint);
        mouseJoint = null;
    }
}

function onMouseOut(canvas, evt) {
    onMouseUp(canvas,evt);
}

function onKeyDown(canvas, evt) {
    //console.log(evt.keyCode);
    /*
    if ( evt.keyCode == 80 ) {//p
        pause();
    }
    else if ( evt.keyCode == 82 ) {//r
        resetScene();
    }
    else if ( evt.keyCode == 83 ) {//s
        step();
    }
    else if ( evt.keyCode == 88 ) {//x
        zoomIn();
    }
    else if ( evt.keyCode == 90 ) {//z
        zoomOut();
    }
    else if ( evt.keyCode == 37 ) {//left
        canvasOffset.x += 32;
    }
    else if ( evt.keyCode == 39 ) {//right
        canvasOffset.x -= 32;
    }
    else if ( evt.keyCode == 38 ) {//up
        canvasOffset.y += 32;
    }
    else if ( evt.keyCode == 40 ) {//down
        canvasOffset.y -= 32;
    }
    else if ( evt.keyCode == 16 ) {//shift
        shiftDown = true;
    }
    
    if ( currentTest && currentTest.onKeyDown )
        currentTest.onKeyDown(canvas, evt);
    
    draw();
    */
}

function onKeyUp(canvas, evt) {
    if ( evt.keyCode == 16 ) {//shift
        shiftDown = false;
    }
    
    if ( currentTest && currentTest.onKeyUp )
        currentTest.onKeyUp(canvas, evt);
}

function zoomIn() {
    var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    PTM *= 1.1;
    var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
    canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
    draw();
}

function zoomOut() {
    var currentViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    PTM /= 1.1;
    var newViewCenterWorld = getWorldPointFromPixelPoint( viewCenterPixel );
    canvasOffset.x += (newViewCenterWorld.x-currentViewCenterWorld.x) * PTM;
    canvasOffset.y -= (newViewCenterWorld.y-currentViewCenterWorld.y) * PTM;
    draw();
}

function init() {
    
    canvas = document.getElementById("canvas");
    context = canvas.getContext( '2d' );
    
    canvasOffset.x = 0;//canvas.width/2;
    canvasOffset.y = canvas.height;//2;
    
    canvas.addEventListener('mousemove', function(evt) {
        onMouseMove(canvas,evt);
    }, false);
    
    canvas.addEventListener('mousedown', function(evt) {
        onMouseDown(canvas,evt);
    }, false);
    
    canvas.addEventListener('mouseup', function(evt) {
        onMouseUp(canvas,evt);
    }, false);
    
    canvas.addEventListener('mouseout', function(evt) {
        onMouseOut(canvas,evt);
    }, false);
    
    canvas.addEventListener('keydown', function(evt) {
        onKeyDown(canvas,evt);
    }, false);
    
    canvas.addEventListener('keyup', function(evt) {
        onKeyUp(canvas,evt);
    }, false);
    
    myDebugDraw = getCanvasDebugDraw();            
    myDebugDraw.SetFlags(e_shapeBit);
    
    myQueryCallback = new Box2D.JSQueryCallback();

    myQueryCallback.ReportFixture = function(fixturePtr) {
        var fixture = Box2D.wrapPointer( fixturePtr, b2Fixture );
        if ( fixture.GetBody().GetType() != Box2D.b2_dynamicBody ) //mouse cannot drag static bodies around
            return true;
        if ( ! fixture.TestPoint( this.m_point ) )
            return true;
        this.m_fixture = fixture;
        return false;
    };
}

function changeTest() {    
    resetScene();
    if ( currentTest && currentTest.setNiceViewCenter )
        currentTest.setNiceViewCenter();
    draw();
}

function createWorld() {
    
    if ( world != null ) 
        Box2D.destroy(world);
        
    world = new Box2D.b2World( new Box2D.b2Vec2(0.0, -10.0) );
    world.SetDebugDraw(myDebugDraw);
    
    mouseJointGroundBody = world.CreateBody( new Box2D.b2BodyDef() );
    
    currentTest = new level_maze_0();
    
    currentTest.setup();
}

function resetScene() {
    createWorld();
    draw();
}

function step(timestamp) {
    
    if ( currentTest && currentTest.step ) 
        currentTest.step();
    
    if ( ! showStats ) {
        world.Step(1/60, 3, 2);
        draw();
        return;
    }
    
    var current = Date.now();
    world.Step(1/60, 3, 2);
    var frametime = (Date.now() - current);
    frameTime60 = frameTime60 * (59/60) + frametime * (1/60);
    
    draw();
    statusUpdateCounter++;
    if ( statusUpdateCounter > 20 ) {
        updateStats();
        statusUpdateCounter = 0;
    }
}

function draw() {
    
    //black background
    context.fillStyle = '#fff';
    context.fillRect( 0, 0, canvas.width, canvas.height );
    
    context.save();            
    context.translate(canvasOffset.x, canvasOffset.y);
    context.scale(1,-1);                
    context.scale(PTM,PTM);
    context.lineWidth /= PTM;
    
    drawAxes(context);
    
    context.fillStyle = '#000';
    world.DrawDebugData();
        
    context.restore();
}

function updateStats() {
    // nope
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
})();

function animate() {
    if ( run )
        requestAnimFrame( animate );
    step();
}

function pause() {
    run = !run;
    if (run)
        animate();
    updateStats();
}