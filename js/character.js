/*****************

STAKEOUT
CHARACTER CLASS
Chip Limeburner

This is a very short class, mostly for tracking the spatial parameters of our characters.
Things like position, destination and velocity.

******************/


class Character {

  constructor(x, y, image) {
    this.x = x;         //x position
    this.y = y;         //y position
    this.dx = 0;        //x-axis displacement
    this.dy = 0;        //y-axis displacement
    this.drot = 0;      //the angular displacement
    this.image = image; //the character's silhouette

    this.orientation = 1; //whether or not the image should be flipped

    this.targetX = 0;     //destinaiton x position
    this.targetY = 0;     //destination y position
    this.targetRot = 0;   //destination rotation
    this.moving = 0;      //is it moving or not

    //creating a sprite for the character for easy of manipulation
    this.sprite = createSprite(
            this.x,                          //X coordinate
            this.y,                          //Y coordinate
            archWindowWidth,                 //width
            archWindowHeight);               //height
    this.sprite.addImage(`face`,this.image); //giving the sprite their face
  }

  update() {

    push();

    imageMode(CENTER);

    this.sprite.mirrorX(this.orientation); //flip the sprite to match the appropriate orientation

    //if the character is moving, update the position by the displacement
    if (this.moving == 1) {
      this.sprite.position.x += this.dx;
      this.sprite.position.y += this.dy;
    }

    //if the character has reached it's target destination +- the speed it's going at, stop.
    if (this.sprite.position.x <= this.targetX + Math.abs(this.dx)
    && this.sprite.position.x >= this.targetX - Math.abs(this.dx)
    && this.sprite.position.y >= this.targetY + Math.abs(this.dy)
    && this.sprite.position.y <= this.targetY - Math.abs(this.dy)) {
      this.dx = 0;
      this.dy = 0;
      this.moving = 0;
    }

    pop();
  }







}
