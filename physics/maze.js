var level_maze_0 = function() {
    //constructor
}

level_maze_0.prototype.setNiceViewCenter = function() {
    //called once when the user changes to this test from another test
    PTM = 30;
}

level_maze_0.prototype.setup = function() {
    //set up the Box2D scene here - the world is already created
    
    var ground = world.CreateBody(new b2BodyDef());

    var shape;

    // Edge of game
    shape = new b2EdgeShape();
    shape.Set(new b2Vec2(0,0), new b2Vec2(10,0));
    ground.CreateFixture(shape, 0.0);
    shape.Set(new b2Vec2(10,0), new b2Vec2(10,10));
    ground.CreateFixture(shape, 0.0);
    shape.Set(new b2Vec2(10,10), new b2Vec2(0,10));
    ground.CreateFixture(shape, 0.0);
    shape.Set(new b2Vec2(0,10), new b2Vec2(0,0));
    ground.CreateFixture(shape, 0.0);
    
    shape = new b2PolygonShape();
    shape.SetAsBox(2, 2, new b2Vec2(0,5), Math.TAU/8);
    ground.CreateFixture(shape, 0.0);
    shape.SetAsBox(2, 2, new b2Vec2(10,5), Math.TAU/8);
    ground.CreateFixture(shape, 0.0);

}