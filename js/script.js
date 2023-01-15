"use strict";
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
/*****************

STAKEOUT
Author: Chip Limeburner

Stakeout is a playable story experience making use of a tangible peripheral
interface and leveraging concepts of ambiguity and self-constructed narrative.
In borrowing the framing device of Alfred Hitchcock's Rear Window, players are
shown a story, but one of which they don't have all the deals, requiring them
to gather their own evidence and piece together their own understanding of what
takes place.

******************/
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
/******************

FUNCTIONS FOUND IN THIS DOCUMENT:

preload() - Loads assets.
setup() - Initializes serial port if available, various variables supporting the game geometry, and sprites with their associated images and animations.
draw() - Determines if the game is in a state for the start screen, main game, or concluding "dark room" and calls functions accordingly.

loadGraphics() - Loads all the PNGs for graphics and sprites.
resizeGraphics() - Resizes loaded images to the appriorate size to appear in windows.
initializeSprites() - Creates null sprites for everything that needs sprites.
assignGraphics() - Ties animations and images to their respective sprites.
keypressed() - Event listener for key presses.
peripheralKeyPressed() - Simulates event listener for inputs coming from the tangible camera peripheral.
storePreviousData() - Stores a copy of previous data from serial channel for comparison and signal edge detection.
parseData() - Recieves the byte from the serial channel and breaks it up into seperate button inputs.
displayStartBackground() - Draws the background of the start screen.
displayStartText() - Draws the text and instructions on the start screen.
updateTimer() - Increments variables for frames, seconds, and minutes, since the start of the main draw loop, creating a usable time code for cue functions.
checkInputs() - Takes data from both keypress events and incoming serial data and transltes both inputs to usable game commands.
mainLoopGraphics() - Draws all the graphics for the main game loop.
zoomIn() - Scales graphics and centers the view on the window the player is currently "focused" on.
mainFadeIn() - Opens the main game loop with a black overlay that fades to transparent.
mainFadeOut() - Fades the black overlay in to fade view to black.
displayBackground() - Draws the sky, moon and trees.
displayHouseBackground() - Draws the general box outlining the house and the interior lighting of the windows.
displayHouseInterior() - Draws the furntiture and character sprites.
referenceBeatSheet() - Contains all the cues that dictate character movement during the main game.
displayHouseForeground() - Draws the roof, top row of windows, window frames and sills, and a grid of brick-colored bars that mask the spaces between windows.
displayFocus() - Draws the dotted line that indcates which window the player is "focused" on.
displayFilmRemaining() - Draws the counter for how many pictures the player has left to take.
displayCameraBarrel() - Draws the circular mask when the player view is zoomed in.
displayGlare() - Draws a white overlay on the screen when the player takes a picture that fades.
checkZoom() - Checks to see if the player is zooming or not. Handles the inverted logic between keyboard vs peripheral inputs for zooming.
moveCue(minutes, second, frame, character, posX, posY, velX, velY) - Cues translations over time of characters.
turnCue(minute, second, frame, character, dir) - Cues characters flipping horizontally.
snapCue(minute, second, frame, character, xPos, yPos) - Cues instantaneous translations of characters.
lightCue(minute, second, frame, room, value) - Cues a toggling of state for window lighting.
animationCue(minute, second, frame, sprite, animation) - Cues a change in animation for sprites (mostly used for door animation).
soundCue(minute, second, frame, sound) - Cues a sound effect.
assignPhotoPositions() - Randomly generates positions and rotations for the photos displayed on the final screen.
displayDarkroomBackground() - Draws the background of the darkroom.
displayPhotos() - Draws the photos you took over the course of the game, strewn about.
darkroomOverlay() - Draws a red tint over the entire screen.
displayDarkroomText() - Draws the text overlay for the final screen.

******************/
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

//variable to track game state (1 = start screen, 2 = game, 3 = darkroom)
let gameState = 1;

//varible for incoming serial port
let serial;

//variable to track if a peripheral is connected
let peripheralConnected = 0;

//variable for incoming serial data
let data = 0;

//arrays to store translated data from the serial input
let upButton = 0;
let downButton = 0;
let leftButton = 0;
let rightButton = 0;
let lightSensor = 0;
let snapButton = 0;

//arrays to store previous value for translated data from the serial input
let prevUpButton = 0;
let prevDownButton = 0;
let prevLeftButton = 0;
let prevRightButton = 0;
let prevLightSensor = 0;
let prevSnapButton = 0;

/* Arrays to track window information
Arrays are fully spelled out but blank, in part to aid initialization, but also
to sketch out their structure and kinds of data they will hold. Each represents
the 6x4 grid of windows as they appear on the house in the game, with
windowPositions holding coordinate pairs for each window. */
let windowPositions = [
  [ [ , ], [ , ], [ , ], [ , ], [ , ], [ , ] ],
  [ [ , ], [ , ], [ , ], [ , ], [ , ], [ , ] ],
  [ [ , ], [ , ], [ , ], [ , ], [ , ], [ , ] ],
  [ [ , ], [ , ], [ , ], [ , ], [ , ], [ , ] ]
];

let windowLights = [
  [ , , , , , ],
  [ , , , , , ],
  [ , , , , , ],
  [ , , , , , ]
];

let furnitureSprites = [
  [ , , , , , ],
  [ , , , , , ],
  [ , , , , , ],
  [ , , , , , ]
];

//size of the building
let houseWidth;
let houseHeight;

//offset values that create a "new origin" at the upper-left corner of the house.
let houseXOffset;
let houseYOffset;

//variables to size the windows
let archWindowWidth;
let archWindowHeight;

//grid coordinates for the window the players are focused on
let focusX;
let focusY;

//pixel coordinates for the window the players are focused on
let originX;
let originY;

//a variable to store the scale of objects being viewed
let viewScale = 1;

//variable that allows us to listen for "photo taking" whenever but avoid photographing non-digetic graphics
let snapshotBuffer = false;

//variable to provide the strength of glare when a photo is taken
let glare = 0;

//variable for fading into the game from black
let startFadeIn = 1;

//an array to hold the photos taken
let photo = [];

//a variable to track remaining film
let filmRemaining = 24;

//for storing the imported font
let gameFont;

//variable to store our sound effects
let flashbulb;
let gunshot;
let ambience;

//variable to hold the start screen graphic
let blurredShot;
let instructions;

//variable for film roll UI graphic
let filmRoll;

//variables for furniture silhouette sprites
let staircase;
let nightstand;
let diningtable;
let kitchen;
let chair;
let lamp;
let parlor;
let doorClosed;
let doorOpened;
let doorClosing;
let doorOpening;

//variables to track frames and time to choreograph the "show"
let minutes = 0;
let seconds = 0;
let frames = 0;

//variabels to store our cast of character
let profPuce;
let ladyLilac;
let sirCyan;
let mrsMaroon;
let drDrab;
let cptCobalt;

//variables for our character images
let puce;
let lilac;
let cyan;
let maroon;
let drab;
let cobalt;

//variables for displaying pictures in the darkroom
let photoPositionsAssigned = 0;
let randomRotation = [];
let randomX = [];
let randomY = [];


// preload()
// Description of preload
function preload() {
  //load the images for sprites
  loadGraphics();

  //load the Mystery Forest font by Xerographer fonts (https://www.1001freefonts.com/mystery-forest.font)
  gameFont = loadFont('assets/fonts/mystery-forest/MysteryForest.ttf');

  //load our sound fx
  soundFormats('mp3');
  gunshot = loadSound('assets/sounds/gunshot.mp3'); //a single shot in the distance. Source: BBC, (raw audio: https://sound-effects.bbcrewind.co.uk/search?q=07010122)
  flashbulb = loadSound('assets/sounds/flashbulb.mp3'); //vintage flashbulb sound. Source: Instant Media Musics (https://www.youtube.com/watch?v=YDdYUN83aYc&ab_channel=InstantMediaMusics)
  ambience = loadSound('assets/sounds/ambience.mp3'); //nighttime ambient soundscape. Source: BBC, (raw audio: https://sound-effects.bbcrewind.co.uk/search?q=07051098)
}


// setup()
// Description of setup
function setup() {
  //serial connection from camera peripheral setup
  serial = new p5.SerialPort(); //create serial port object
  serial.open("/dev/tty.usbserial-DA00WTHG"); //open the appropriate serial port
  serial.on('open', function () { //check to see if a peripheral "camera" was succesfully opened at the above serial port. If so, mark peripheralConnected as true.
    peripheralConnected = 1;
  });

  createCanvas(windowWidth, windowHeight); //create the canvas

  //set the size of the building
  houseWidth = width*0.6;
  houseHeight = height*0.7;
  //set the house's offset and the operational origin for game mechanics using the front of the house
  houseXOffset = width*0.2;
  houseYOffset = height*0.25;
  //set the size of the windows
  archWindowWidth = houseWidth/12;
  archWindowHeight = houseHeight/6;
  //array to store all the window center points
  for (let i = 0; i < 4; i++) { //for each row
    for (let j = 0; j < 6; j++) { //for each column
      windowPositions[i][j][0] = houseWidth * ((1+(2*j))/12); //iterate X coordinates as ratio of houseWidth
      windowPositions[i][j][1] = houseHeight * ((1+(2*i))/8); //iterate Y coordinates as ratio of houseHeight
    }
  }

  //array to track in which windows the lights are on
  windowLights = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0],
    [1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1]
  ];

  //grid coordinateds for the window the players are focused on
  focusX = 0;
  focusY = 0;
  //pixel coordinates for the window the players are focused on
  originX = houseXOffset + windowPositions[focusY][focusX][0];
  originY = houseYOffset + windowPositions[focusY][focusX][1];

  //graphics setup
  resizeGraphics(); //make sure all our images are the same size as the windows they appear in
  initializeSprites(); //create all our empty sprites
  assignGraphics(); //assign images to sprites

  //construct the cast of characters and give them a few starting touches
  profPuce = new Character(windowPositions[3][3][0]+houseXOffset, windowPositions[3][1][1]+houseYOffset, puce);
  ladyLilac = new Character(windowPositions[2][0][0]+houseXOffset, windowPositions[2][0][1]+houseYOffset, lilac);
  sirCyan = new Character(windowPositions[2][1][0]+houseXOffset, windowPositions[2][1][1]+houseYOffset, cyan);
  mrsMaroon = new Character(windowPositions[3][5][0]+houseXOffset-width/64, windowPositions[3][5][1]+houseYOffset, maroon);
  drDrab = new Character(windowPositions[3][0][0]+houseXOffset, windowPositions[3][0][1]+houseYOffset, drab);
  cptCobalt = new Character(windowPositions[3][1][0]+houseXOffset-width/64, windowPositions[3][3][1]+houseYOffset, cobalt);
  //some of the characters should just start facing a certain way
  profPuce.orientation = -1;
  ladyLilac.orientation = -1;
  drDrab.orientation = -1;

  ambience.setVolume(0.25); //lower the colume on the ambient track
}


// draw()
// Description of draw()
function draw() {
  if (gameState == 1) { //start screen
    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////////// START SCREEN ///////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    displayStartBackground(); //display the background

    displayStartText(); //display the text over the background

  } else if (gameState == 2) {
    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////////// MAIN GAME ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    //If the ambience isn't playing, play it
    if (ambience.isPlaying() == false) {
      ambience.play(); //playing the ambience
    }

    updateTimer(); //update the running timer at each frame

    checkInputs(); //check for input from either camera or keyboard

    mainLoopGraphics(); //display the graphics

  } else if (gameState == 3) {
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// DARKROOM ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    assignPhotoPositions();
    displayDarkroomBackground();
    displayPhotos();
    darkroomOverlay();
    displayDarkroomText();

  }
}


// loadGraphics()
// a function that holds all our loadImage and loadAnimation calls
function loadGraphics() {
  //start screen images
  blurredShot = loadImage(`assets/images/blurredshot.png`);
  instructions = loadImage(`assets/images/controls.png`);

  //GUI images
  filmRoll = loadImage(`assets/images/film_roll.png`); //load the film roll image

  //funriture images
  staircase = loadImage(`assets/images/staircase.png`); //load the staircase silhouette image
  nightstand = loadImage(`assets/images/nightstand.png`); //load the bed & nightstand silhouette image
  diningtable = loadImage(`assets/images/diningtable.png`); //load the dining table silhouette image
  chair = loadImage(`assets/images/chair.png`); //load the chair silhouette image
  lamp = loadImage(`assets/images/lamp.png`); //load the lamp silhouette image
  parlor = loadImage(`assets/images/chairlamp.png`); //load the chair & lamp silhouette image
  kitchen = loadImage(`assets/images/kitchen.png`); //load the kitchen silhouette image

  //door states
  doorClosed = loadImage(`assets/images/door_0001.png`);
  doorOpened = loadImage(`assets/images/door_0008.png`);
  doorClosing = loadAnimation(
      `assets/images/door_0008.png`,
      `assets/images/door_0007.png`,
      `assets/images/door_0006.png`,
      `assets/images/door_0005.png`,
      `assets/images/door_0004.png`,
      `assets/images/door_0003.png`,
      `assets/images/door_0002.png`,
      `assets/images/door_0001.png`);
  doorOpening = loadAnimation(
      `assets/images/door_0001.png`,
      `assets/images/door_0002.png`,
      `assets/images/door_0003.png`,
      `assets/images/door_0004.png`,
      `assets/images/door_0005.png`,
      `assets/images/door_0006.png`,
      `assets/images/door_0007.png`,
      `assets/images/door_0008.png`);

  //characters
  puce = loadImage(`assets/images/puce.png`);
  lilac = loadImage(`assets/images/lilac.png`);
  cyan = loadImage(`assets/images/cyan.png`);
  maroon = loadImage(`assets/images/maroon.png`);
  drab = loadImage(`assets/images/drab.png`);
  cobalt = loadImage(`assets/images/cobalt.png`);
}


// resizeGraphics()
// a function that makes all our images the same size as our windows
function resizeGraphics() {
  //iterate over each animation frame and resize correctly
  staircase.resize(archWindowWidth, archWindowHeight);
  nightstand.resize(archWindowWidth, archWindowHeight);
  diningtable.resize(archWindowWidth, archWindowHeight);
  chair.resize(archWindowWidth, archWindowHeight);
  lamp.resize(archWindowWidth, archWindowHeight);
  parlor.resize(archWindowWidth, archWindowHeight);
  kitchen.resize(archWindowWidth, archWindowHeight);
  for (let i = 0; i < doorClosing.images.length; i++) {
    doorClosing.images[i].resize(archWindowWidth, archWindowHeight); //makes sprites fit in the windows
  }
  for (let i = 0; i < doorOpening.images.length; i++) {
    doorOpening.images[i].resize(archWindowWidth, archWindowHeight); //makes sprites fit in the windows
  }
  doorClosed.resize(archWindowWidth, archWindowHeight);
  doorOpened.resize(archWindowWidth, archWindowHeight);
  puce.resize(archWindowWidth, archWindowHeight);
  lilac.resize(archWindowWidth, archWindowHeight);
  cyan.resize(archWindowWidth, archWindowHeight);
  maroon.resize(archWindowWidth, archWindowHeight);
  drab.resize(archWindowWidth, archWindowHeight);
  cobalt.resize(archWindowWidth, archWindowHeight);
}


// initializeSprites()
// a function that procedural creates all our background and animation sprites
function initializeSprites() {
  //initialize all the furniture silhouette sprites
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 6; j++) {
      furnitureSprites[i][j] = createSprite(
              houseXOffset + windowPositions[i][j][0],   //X coordinate
              houseYOffset + windowPositions[i][j][1],   //Y coordinate
              archWindowWidth,                           //width
              archWindowHeight);                         //height
      furnitureSprites[i][j].visible = true;
    }
  }
  //making certain sprites invisible because they don't actually have any content for this house layout
  for (let i = 0; i < 6; i++) {
    furnitureSprites[0][i].visible = false;
  }
  furnitureSprites[1][3].visible = false;
  furnitureSprites[2][3].visible = false;
}


// assignGraphics()
// a function that connects images to the appropriate sprites
function assignGraphics() {
  //update the staircase silhouettes
  for (let i = 1; i < 4; i++) {
    furnitureSprites[i][2].addImage(`stairs`,staircase);
  }
  furnitureSprites[2][2].mirrorX(-1);
  //update the bedroom silhouettes
  for (let i = 0; i < 6; i = i+5) {
    for (let j = 1; j < 3; j++) {
      furnitureSprites[j][i].addImage(`nightstand`,nightstand);
      if (i > 3) {
        furnitureSprites[j][i].mirrorX(-1);
      }
    }
  }
  //update the dining room silhouettes
  furnitureSprites[3][3].addImage(`table`,diningtable);
  furnitureSprites[3][4].addImage(`table`,diningtable);
  furnitureSprites[3][3].mirrorX(-1);
  //update the parlor silhouettes
  furnitureSprites[3][0].addImage(`parlor`,parlor);
  furnitureSprites[3][1].addImage(`chair`,chair);
  furnitureSprites[3][1].mirrorX(-1);
  //update the kitchen silhouettes
  furnitureSprites[3][5].addImage(`kitchen`,kitchen);
  //update the bedroom doors
  for (let i = 1; i < 3; i++) {
    for (let j = 1; j < 5; j += 3) {
      furnitureSprites[i][j].addImage(`closed`,doorClosed);
      furnitureSprites[i][j].addImage(`open`,doorOpened);
      furnitureSprites[i][j].addAnimation(`closing`,doorClosing);
      furnitureSprites[i][j].addAnimation(`opening`,doorOpening);
      furnitureSprites[i][j].changeAnimation(`closed`);
      if (j == 4) {
        furnitureSprites[i][j].mirrorX(-1);
      }
    }
  }
}


// keyPressed()
// a function that listens for key presses and responds accordingly
function keyPressed() {
  if (keyCode === 32 && gameState === 1) { //if you're on the start screen, press space to start
    gameState++;
    return;
  } else if (keyCode === 32 && gameState === 3) { //if you're on the darkroom screen, press space to restart the game
    location.reload();
    return;
  } else if (keyCode === 65 && focusX > 0) { //A to move left
    focusX--;
  } else if (keyCode === 68 && focusX < 5) { //D to move right
    focusX++;
  } else if (keyCode === 87 && focusY > 0) { //W to move up
    focusY--;
  } else if (keyCode === 83 && focusY < 3) { //S to move down
    focusY++;
  } else if (keyCode === 32 && filmRemaining > 0) { //spacebar to take a picture
    snapshotBuffer = true;
  }
}


// peripheralKeyPressed()
// a function that basically does the same as keyPressed but with the input from serial data
function peripheralKeyPressed() {
  if (upButton > prevUpButton && focusY > 0) { //up to move up
    focusY--;
  } else if (rightButton > prevRightButton && focusX < 5) { //right to move right
    focusX++;
  } else if (leftButton > prevLeftButton && focusX > 0) { //left to move left
    focusX--;
  } else if (downButton > prevDownButton && focusY < 3) { //down to move down
    focusY++;
  } else if (snapButton > prevSnapButton && filmRemaining > 0) { //snap to take a picture
    snapshotBuffer = true;
  }
}


// storePreviousData
// a function to store last states for signal edge detection
function storePreviousData() {
  prevUpButton = upButton;
  prevDownButton = downButton;
  prevLeftButton = leftButton;
  prevRightButton = rightButton;
  prevLightSensor = lightSensor;
  prevSnapButton = snapButton;
}


// parseData()
// a function that translates incoming serial data to a format we need it in, uses modulo to break up the incoming byte
// Metaphorically speaking, incoming byte (0-0-0-0-0-0-0-0) digits formated as:
// null - null - snapButton - lightButton - downButton - leftButton - rightButton - upButton
// but actual incoming number is a 0-to-255 situation, hence the base 2 division and modulo
function parseData() {
  snapButton = Math.floor(data/32);
  lightSensor = Math.floor((data % 32)/16);
  downButton = Math.floor((data % 16)/8);
  leftButton = Math.floor((data % 8)/4);
  rightButton = Math.floor((data % 4)/2);
  upButton = Math.floor((data % 2));
}


// displayStartBackground
// a function that draws the background graphics of the start screen
function displayStartBackground() {
  push();
  background(0); //set background to black
  //blurry background graphic
  imageMode(CENTER);
  tint(255,100);
  image(blurredShot, width/2, height/2, height*1.15, height);
  pop();
}


// displayStartText
// a function that draws the text of the start screen over the background
function displayStartText() {
  //start screen text and controls
  push();
  imageMode(CENTER);
  fill(255,255,255);
  textSize(230);
  textFont(`Courier`);
  textAlign(CENTER);
  text(`STAKEOUT`, width/2, height/3.25);
  tint(255,255);
  image(instructions, width/2, height/1.75, width/2, height/2);
  textSize(55);
  text(`Press 'spacebar' to start`, width/2, 2.75*height/3.25);
  pop();
}


// updateTimer()
// a function that updates the timer used to meter out the game "cues"
function updateTimer() {
  //update timer
  frames++;
  if (frames == 60) {
    frames = 0;
    seconds++;
  }
  if (seconds == 60) {
    seconds = 0;
    minutes++;
  }
}


// checkInputs()
// a function that checks for both incoming serial data and key presses and parse both as inputs for the game
function checkInputs() {
  //pull the serial comms data and parse it appropriately. Send "key" commands if neccesary.
  if (serial.available() > 0) {
    data = serial.last();
  }
  storePreviousData(); //store last serial data states for signal edge detection
  parseData(); //breakdown serial data into usable variables
  peripheralKeyPressed(); //acts like keyPressed() but checks the formatted data from the serial input
}


// mainLoopGraphics()
// a function that does all the graphics drawing for our main game
function mainLoopGraphics() {
  //handling zooming effects and scaling on the back end
  viewScale = 1; //default graphics to zoomed out view
  //zoom in when the SHIFT key is pressed
  if (checkZoom()) {
    zoomIn();
  }
  //update "origin" used for focus and zooming in
  originX = houseXOffset + windowPositions[focusY][focusX][0];
  originY = houseYOffset + windowPositions[focusY][focusX][1];

  //draw the actual graphics
  noStroke(); //set shapes to not have an outline by default
  displayBackground(); //draw the background
  displayHouseBackground(); //draw the building
  displayHouseInterior();
  displayHouseForeground();
  displayFocus(); //show which window the camera is focused on
  if (checkZoom()) {
    displayCameraBarrel(); //when zoomed in, use a "barrel" effect to restrict peripheral vision
  }
  displayGlare(); //checks if snapshotBuffer is true, and if so, creates a bulb flash effect. Also fades the flash effect each frame.
  displayFilmRemaining(); //show the number of photos you have left to take

  mainFadeIn(); //fades in from black

  //Fade to black at the end of the story
  if (minutes >= 1 && seconds >= 43) {
    mainFadeOut(); //fade out the visuals
    ambience.setVolume(0, 3); //fade out the ambient track
  }
}


// zoomIn()
// a function that "zooms in", scaling graphics accordingly and centering them on screen based on your "focus"
function zoomIn() {
  viewScale = 6;
  scale(viewScale);
  translate(
        -originX + width/(2*viewScale),
        -originY + height/(2*viewScale));
}


// mainFadeIn()
// a function that fades in the main game when you start
function mainFadeIn() {
  // a routine that fades the main game in from black
  if (startFadeIn > 0.005) {
    startFadeIn -= 0.005;
    push();
    fill(`rgba(0, 0, 0, ${startFadeIn})`);
    rect(width/2, height/2, width, height);
    pop();
  }
}


// mainFadeOut()
// a function that fades in the main game when you start
function mainFadeOut() {
  // a routine that fades the main game in from black
  if (startFadeIn <= 0.995) {
    startFadeIn += 0.010;
    push();
    fill(`rgba(0, 0, 0, ${startFadeIn})`);
    rect(width/2, height/2, width, height);
    pop();
  } else {
    gameState = 3;
  }
}


// displayBackground()
// a function that draws the background and trees
function displayBackground() {
  background(0,20,60); //dark blue sky

  //moon
  for (let i = 0; i < 40; i++) {
    fill(`rgba(250,250,200,${(1-(i/40))/2})`);
    circle( //draw the paraselene
        6*width/7,          //X coordinate
        height/7,           //Y coordinate
        (i/25)*width/16);   //size
  }
  fill(250, 250, 200); //pale yellow moon
  circle(  //draw the moon itself
        6*width/7,          //X coordinate
        height/7,           //Y coordinate
        width/16);          //size


  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////// BEGINNING OF A BUNCH OF ARBITRARILY PLACED TREES ///////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Broadly speaking these trees are drawn in rows from left of screen to right.
  //They were positioned to taste rather than through any pattern.
  //I know this looks like garbage but I honestly think this is better than breaking their parameters up line-by-line.
  //Just, uh, y'know, don't miss the forest for the trees...

  //back row of trees
  fill(0, 10, 0); //very dark green
  triangle (width/20 - width/40, width/12, width/10 - width/40, height, 0 - width/40, height);
  triangle (width/20 + width/24, width/12, width/10 + width/24, height, 0 + width/24, height);
  triangle (width/20 + width/14, width/12, width/10 + width/14, height, 0 + width/14, height);
  triangle (width/20 + width/7, width/12, width/10 + width/7, height, 0 + width/7, height);
  triangle (width/20 + width/3, width/12, width/10 + width/3, height, 0 + width/3, height);
  triangle (width/20 + width/2, width/12, width/10 + width/2, height, 0 + width/2, height);
  triangle (width/20 + width/1.65, width/12, width/10 + width/1.65, height, 0 + width/1.65, height);
  triangle (width/20 + width/1.55, width/12, width/10 + width/1.55, height, 0 + width/1.55, height);
  triangle (width/20 + width/1.5, width/12, width/10 + width/1.5, height, 0 + width/1.5, height);
  triangle (width/20 + width/1.25, width/12, width/10 + width/1.25, height, 0 + width/1.25, height);
  triangle (width/20 + width/1.2, width/12, width/10 + width/1.2, height, 0 + width/1.2, height);
  triangle (width/20 + width/1.1, width/12, width/10 + width/1.1, height, 0 + width/1.1, height);
  triangle (width/20 + width/1.075, width/12, width/10 + width/1.075, height, 0 + width/1.075, height);

  //middle row of trees
  fill(0, 20, 0); //lighter green
  triangle (width/14, width/8, width/7, height, 0, height);
  triangle (width/14 + width/1.15, width/8, width/7 + width/1.15, height, 0 + width/1.15, height);
  triangle (width/14 + width/1.35, width/8, width/7 + width/1.35, height, 0 + width/1.35, height);

  //front row of trees
  fill(0, 30, 0); //lightest green
  triangle (width/14 - width/15, width/7, width/7 - width/15, height, 0 - width/15, height);
  triangle (width/14 - width/35, width/7, width/7 - width/35, height, 0 - width/35, height);
  triangle (width/14 + width/35, width/7, width/7 + width/35, height, 0 + width/35, height);
  triangle (width/14 + width/12, width/7, width/7 + width/12, height, 0 + width/12, height);
  triangle (width/14 + width/10, width/7, width/7 + width/10, height, 0 + width/10, height);
  triangle (width/14 + width/1.45, width/7, width/7 + width/1.45, height, 0 + width/1.45, height);
  triangle (width/14 + width/1.32, width/7, width/7 + width/1.32, height, 0 + width/1.32, height);
  triangle (width/14 + width/1.28, width/7, width/7 + width/1.28, height, 0 + width/1.28, height);
  triangle (width/14 + width/1.18, width/7, width/7 + width/1.18, height, 0 + width/1.18, height);
  triangle (width/14 + width/1.12, width/7, width/7 + width/1.12, height, 0 + width/1.12, height);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////// END OF A BUNCH OF ARBIRARILY PLACED TREES /////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////


  //gradient from the ground up, just to set some ambience and mood
  for (let i = 0; i < 40; i++) {
    push();
    fill(`rgba(0,0,0,${1-(i/40)})`);
    rectMode(LEFT, TOP);
    rect(0, height - (i * 10), width, 10);
    pop();
  }
}


// displayHouse()
// a function that draws the parts of the house behind the plane of the sprites
function displayHouseBackground() {
  //draw the building
  fill(30, 0, 0);
  rectMode(CENTER);
  rect(
      width/2,                  //X Coordinate
      height*0.15 + height/2,   //Y Coordinate
      houseWidth,               //width
      houseHeight);             //height

  //draw the windows
  rectMode(CENTER);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 6; j++) {
      //window openings
      if (windowLights[i][j] == 0) {
        fill(0, 0, 30); //dark
      } else {
        fill(200, 200, 100); //light
      }
      rect(
          houseXOffset + windowPositions[i][j][0],  //X position
          houseYOffset + windowPositions[i][j][1],  //Y position
          archWindowWidth,                          //width
          archWindowHeight);                        //height
    }
  }
}


// displayHouseInterior
// a function that updates and draws the sprites inside the house
function displayHouseInterior() {

  //update the characters at each frame
  profPuce.update();
  ladyLilac.update();
  sirCyan.update();
  mrsMaroon.update();
  drDrab.update();
  cptCobalt.update();

  referenceBeatSheet(); //check for cues at current time

  drawSprites(); //draw sprites
}


// referenceBeatSheet()
// a function containing all the cues for what happnes in the game
function referenceBeatSheet() {
  //this is all the choreography for the game
  moveCue(0, 1, 0, mrsMaroon, windowPositions[3][4][0] + houseXOffset, windowPositions[3][4][1] + houseYOffset, -1, 0); //maroon to dining room
  turnCue(0, 3, 0, ladyLilac, 1); //lilac turn left
  turnCue(0, 4, 0, mrsMaroon, -1); //Maroon turn right
  moveCue(0, 4, 0, mrsMaroon, windowPositions[3][5][0] + houseXOffset, windowPositions[3][5][1] + houseYOffset, 1, 0); //maroon to kitchen
  turnCue(0, 5, 0, profPuce, 1); //Puce turn left
  moveCue(0, 5, 0, profPuce, windowPositions[3][1][0] + houseXOffset + archWindowWidth/2, windowPositions[3][1][1] + houseYOffset, -1, 0); //puce to parlor
  turnCue(0, 8, 0, ladyLilac, -1); //lilac turn right
  turnCue(0, 9, 0, cptCobalt, -1); //cobalt turn right
  moveCue(0, 12, 0, drDrab, windowPositions[3][4][0] + houseXOffset - width/64, windowPositions[3][4][1] + houseYOffset, 1, 0); //drab to dining room
  turnCue(0, 14, 0, ladyLilac, 1); //lilac turn left
  turnCue(0, 17, 0, mrsMaroon, 1); //Maroon turn left
  moveCue(0, 17, 0, mrsMaroon, windowPositions[3][4][0] + houseXOffset + width/64, windowPositions[3][4][1] + houseYOffset, -1, 0); //maroon to dining room
  turnCue(0, 22, 30, drDrab, 1); //drab turn left
  moveCue(0, 23, 0, drDrab, windowPositions[3][3][0] + houseXOffset, windowPositions[3][3][1] + houseYOffset, -1, 0); //drab across dining room
  moveCue(0, 23, 0, mrsMaroon, windowPositions[3][2][0] + houseXOffset - archWindowWidth/2, windowPositions[3][2][1] + houseYOffset, -1, 0); //maroon to ground floor hallway
  moveCue(0, 29, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, -1); //maroon climbing stairs to second floor
  snapCue(0, 31, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //maroon snapping to second floor
  moveCue(0, 31, 30, mrsMaroon, windowPositions[2][2][0] + houseXOffset, windowPositions[2][2][1] + houseYOffset, -1, 0); //maroon across second floor hallway
  turnCue(0, 34, 0, sirCyan, -1); //cyan turn right
  animationCue(0, 34, 15, furnitureSprites[2][1], `opening`); //open the door
  animationCue(0, 34, 45, furnitureSprites[2][1], `open`); //the door is open
  moveCue(0, 35, 0, drDrab, windowPositions[3][2][0] + houseXOffset, windowPositions[3][2][1] + houseYOffset, -1, 0); //drab to first floor hallway
  turnCue(0, 36, 0, mrsMaroon, -1); //maroon turn right
  moveCue(0, 36, 0, mrsMaroon, windowPositions[2][3][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][3][1] + houseYOffset, 1, 0); //maroon to second floor right bedroom
  turnCue(0, 36, 15, sirCyan, 1); //cyan turn left
  turnCue(0, 37, 0, sirCyan, -1); //cyan turn right
  moveCue(0, 37, 0, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, 0); //cyan to top of stairs on second floor
  animationCue(0, 38, 15, furnitureSprites[2][4], `opening`); //open the door
  animationCue(0, 38, 45, furnitureSprites[2][4], `open`); //the door is open
  turnCue(0, 39, 0, ladyLilac, 1); //lilac turn left
  lightCue(0, 40, 0, 2, 1); //switch on light in lower-right bedroom
  turnCue(0, 41, 0, mrsMaroon, 1); //maroon turn left
  moveCue(0, 41, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -1, 0); //maroon to staircase
  turnCue(0, 42, 0, ladyLilac, -1); //lilac turn right
  snapCue(0, 42, 0, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset + archWindowWidth/1.5); //cyan snapping in preparation to move to first floor
  turnCue(0, 42, 0, sirCyan, 1); //cyan turn left
  moveCue(0, 42, 0, sirCyan, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset, -1, 1); //cyan to first floor
  moveCue(0, 43, 30, ladyLilac, windowPositions[2][1][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][1][1] + houseYOffset, 1, 0); //lilac to her bedroom door
  moveCue(0, 43, 30, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -1, -1); //maroon to third floor
  snapCue(0, 43, 30, sirCyan, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset); //cyan snapping to first floor
  moveCue(0, 43, 30, sirCyan, windowPositions[3][0][0] + houseXOffset, windowPositions[3][0][1] + houseYOffset, -1, 0); //cyan across parlor
  snapCue(0, 45, 0, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //maroon snap to third floor
  lightCue(0, 45, 30, 1, 0); //switch off  light in lower-left bedroom
  animationCue(0, 45, 30, furnitureSprites[2][1], `closing`); //close the door
  animationCue(0, 45, 30, furnitureSprites[2][1], `closed`); //the door is closed
  animationCue(0, 46, 15, furnitureSprites[1][1], `opening`); //open the door
  moveCue(0, 46, 30, ladyLilac, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, 0); //lilac to top of stairs on second floor
  animationCue(0, 46, 45, furnitureSprites[1][1], `open`); //the door is open
  lightCue(0, 47, 0, 3, 1); //switch on light in upper-left bedroom
  turnCue(0, 47, 30, mrsMaroon, -1); //maroon turn right
  moveCue(0, 47, 30, mrsMaroon, windowPositions[1][4][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][4][1] + houseYOffset, 1, 0); //maroon to third floor right bedroom
  turnCue(0, 47, 45, sirCyan, -1); //cyan turn right
  moveCue(0, 49, 0, cptCobalt, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset, 1, 0); //cobalt to bottom of first floow stairs
  snapCue(0, 50, 0, ladyLilac, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset + archWindowWidth/1.5); //lilac snapping in preparation to move to first floor
  turnCue(0, 50, 0, ladyLilac, 1); //cyan turn left
  moveCue(0, 50, 0, ladyLilac, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset, -1, 1); //lilac to first floor
  snapCue(0, 50, 30, cptCobalt, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset); //cobalt snap to bottom of stairs
  moveCue(0, 50, 30, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, -1); //cobalt climbing stairs to second floor
  snapCue(0, 51, 30, ladyLilac, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset); //lilac snapping to first floor
  turnCue(0, 51, 30, ladyLilac, -1); //lilac turn right
  snapCue(0, 52, 0, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //cobalt snap to second floor
  moveCue(0, 52, 0, cptCobalt, windowPositions[2][3][0] + houseXOffset, windowPositions[2][3][1] + houseYOffset, 1, 0); //cobalt to second floor right bedroom
  animationCue(0, 52, 0, furnitureSprites[1][4], `opening`); //open the door
  animationCue(0, 52, 30, furnitureSprites[1][4], `open`); //the door is open
  lightCue(0, 53, 0, 4, 1); //switch on light in upper-right bedroom
  moveCue(0, 53, 30, ladyLilac, windowPositions[3][4][0] + houseXOffset, windowPositions[3][4][1] + houseYOffset, 1, 0); //lilac to dining room
  turnCue(0, 54, 0, cptCobalt, 1); //cobalt turn left
  moveCue(0, 54, 30, sirCyan, windowPositions[3][3][0] + houseXOffset, windowPositions[3][3][1] + houseYOffset, 1, 0); //cyan to dining room
  turnCue(0, 54, 30, cptCobalt, -1); //cobalt turn right
  turnCue(0, 54, 30, mrsMaroon, 1); //maroon turn left
  moveCue(0, 54, 30, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset, -1, 0); //maroon move to top of stairs third floor
  moveCue(0, 55, 0, profPuce, windowPositions[3][3][0] + houseXOffset + archWindowWidth/2.5, windowPositions[3][3][1] + houseYOffset, 1, 0); //puce to dining room
  turnCue(0, 55, 0, profPuce, -1);
  moveCue(0, 55, 0, cptCobalt, windowPositions[2][4][0] + houseXOffset, windowPositions[2][4][1] + houseYOffset, 1, 0); //cobalt to second floor right bedroom
  turnCue(0, 56, 0, cptCobalt, 1); //cobalt turn left
  animationCue(0, 56, 30, furnitureSprites[2][4], `closing`); //close the door
  animationCue(0, 57, 0, furnitureSprites[2][4], `closed`); //the door is closed
  turnCue(1, 0, 0, mrsMaroon, -1); //maroon turn right
  turnCue(1, 0, 0, ladyLilac, 1); //lilac turn left
  snapCue(1, 0, 0, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset + archWindowHeight/3); //maroon snap to top of third floor stairs
  moveCue(1, 0, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, 1); //maroon descending stairs to second floor
  snapCue(1, 2, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset + archWindowHeight/1.5); //maroon snapping to second floor
  turnCue(1, 2, 0, mrsMaroon, 1); //maroon turn left
  moveCue(1, 2, 0, mrsMaroon, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset, -1, 1); //maroon to first floor
  animationCue(1, 2, 45, furnitureSprites[2][4], `opening`); //open the door
  animationCue(1, 3, 15, furnitureSprites[2][4], `open`); //the door is open
  moveCue(1, 3, 15, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //cobalt across second-floor hall
  snapCue(1, 4, 0, mrsMaroon, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset + archWindowHeight/2.5); //maroon snapping to first floor
  turnCue(1, 4, 0, mrsMaroon, -1); //maroon turns right
  moveCue(1, 4, 30, drDrab, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset, -1, 0); //drab to bottom of first-floor stairs
  moveCue(1, 5, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, -1); //maroon to second floor
  moveCue(1, 5, 15, cptCobalt, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //cobalt up stairs to third floor
  snapCue(1, 5, 30, drDrab, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset + archWindowHeight/2.5); //drab snapping to first floor
  turnCue(1, 5, 30, drDrab, -1); //drab turns right
  snapCue(1, 6, 0, cptCobalt, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //cobalt snap to third floor
  turnCue(1, 6, 30, cptCobalt, -1); //cobalt turns right
  moveCue(1, 6, 30, cptCobalt, windowPositions[1][4][0] + houseXOffset, windowPositions[1][4][1] + houseYOffset, 2, 0); //cobalt to upper-right bedroom
  moveCue(1, 6, 30, drDrab, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 1, -1); //drab to second floor
  snapCue(1, 7, 0, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //maroon snapping to second floor
  moveCue(1, 7, 0, mrsMaroon, windowPositions[2][3][0] + houseXOffset + archWindowWidth/3, windowPositions[2][3][1] + houseYOffset, 1, 0); //maroon across second floor hall
  snapCue(1, 8, 30, drDrab, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //drab snapping to second floor
  moveCue(1, 8, 30, drDrab, windowPositions[2][4][0] + houseXOffset , windowPositions[2][4][1] + houseYOffset, 1, 0); //drab across second floor hall
  turnCue(1, 9, 0, mrsMaroon, 1); //maroon turns left
  turnCue(1, 10, 0, cptCobalt, 1); //cobalt turns left
  turnCue(1, 11, 0, mrsMaroon, -1); //maroon turns right
  turnCue(1, 13, 0, drDrab, 1); //maroon turns left
  soundCue(1, 14, 30, gunshot); //cobalt fires a gun
  moveCue(1, 15, 30, cptCobalt, windowPositions[1][2][0] + houseXOffset - archWindowWidth, windowPositions[1][2][1] + houseYOffset, -2, 0); //cobalt to upper-left bedroom door
  turnCue(1, 15, 20, sirCyan, 1); // the following lines are when everyone in the house is shocked and confused about the gunshot
  turnCue(1, 15, 30, mrsMaroon, 1);
  turnCue(1, 15, 30, profPuce, 1);
  turnCue(1, 15, 37, drDrab, -1);
  turnCue(1, 15, 45, mrsMaroon, -1);
  turnCue(1, 15, 45, profPuce, -1);
  turnCue(1, 16, 0, profPuce, 1);
  turnCue(1, 16, 15, profPuce, -1);
  turnCue(1, 16, 30, sirCyan, -1);
  turnCue(1, 16, 30, mrsMaroon, 1);
  turnCue(1, 16, 30, profPuce, 1);
  turnCue(1, 16, 45, profPuce, -1);
  turnCue(1, 16, 45, drDrab, 1);
  turnCue(1, 17, 0, mrsMaroon, -1);
  turnCue(1, 17, 0, profPuce, 1);
  turnCue(1, 17, 15, profPuce, -1);
  turnCue(1, 17, 30, profPuce, 1);
  turnCue(1, 17, 45, profPuce, -1);
  turnCue(1, 18, 0, profPuce, 1);
  turnCue(1, 18, 0, sirCyan, 1);
  animationCue(1, 18, 30, furnitureSprites[1][1], `opening`); //open the door
  animationCue(1, 19, 0, furnitureSprites[1][1], `open`); //the door is open
  moveCue(1, 19, 0, cptCobalt, windowPositions[1][1][0] + houseXOffset, windowPositions[1][1][1] + houseYOffset, -2, 0); //cobalt to upper-left bedroom
  moveCue(1, 19, 0, sirCyan, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset + archWindowHeight/2.5, -2 ,0); //cyan to bottom of first floor stairs
  moveCue(1, 19, 30, ladyLilac, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset + archWindowHeight/2.5, -2 ,0); //lilac to bottom of first floor stairs
  turnCue(1, 20, 0, cptCobalt, -1); //cobalt turns right
  animationCue(1, 20, 0, furnitureSprites[1][1], `closing`); //open the door
  animationCue(1, 20, 30, furnitureSprites[1][1], `closed`); //the door is open
  turnCue(1, 20, 30, sirCyan, -1); //cyan turns right
  moveCue(1, 20, 30, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, -2); //cyan to second floor
  moveCue(1, 20, 45, profPuce, windowPositions[3][1][0] + houseXOffset + archWindowWidth, windowPositions[3][1][1] + houseYOffset + archWindowHeight/2.5, -2 ,0); //puce to bottom of first floor stairs
  snapCue(1, 21, 30, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //cyan snap to second floor
  moveCue(1, 21, 30, sirCyan, windowPositions[2][3][0] + houseXOffset - archWindowWidth/2, windowPositions[2][3][1] + houseYOffset, 2, 0); //cyan across second floor hall
  turnCue(1, 22, 0, ladyLilac, -1); //lilac turns right
  turnCue(1, 22, 0, mrsMaroon, 1); //maroon turns left
  moveCue(1, 22, 0, ladyLilac, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, -2); //lilac to second floor
  turnCue(1, 22, 30, profPuce, -1); //puce turns right
  moveCue(1, 22, 30, profPuce, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, -2); //puce to second floor
  snapCue(1, 23, 30, profPuce, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //puce snap to second floor
  snapCue(1, 23, 0, ladyLilac, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //lilac snap to second floor
  turnCue(1, 25, 0, sirCyan, 1); //cyan turns left
  moveCue(1, 25, 0, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //cyan to staircase
  moveCue(1, 25, 15, drDrab, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //drab to staircase
  turnCue(1, 25, 15, mrsMaroon, 1); //maroon turns left
  moveCue(1, 25, 15, mrsMaroon, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //maroon to staircase
  moveCue(1, 25, 30, sirCyan, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //cyan to third floor
  turnCue(1, 25, 45, ladyLilac, 1); //lilac turns left
  moveCue(1, 25, 45, ladyLilac, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //lilac to staircase
  turnCue(1, 25, 45, profPuce, 1); //puce turns left
  moveCue(1, 25, 45, profPuce, windowPositions[2][2][0] + houseXOffset + archWindowWidth/2, windowPositions[2][2][1] + houseYOffset, -2, 0); //puce to staircase
  moveCue(1, 26, 15, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //maroon to third floor
  snapCue(1, 26, 30, sirCyan, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //cyan snap to third floor
  turnCue(1, 26, 30, sirCyan, -1); //cyan turns right
  moveCue(1, 26, 30, sirCyan, windowPositions[1][5][0] + houseXOffset, windowPositions[1][5][1] + houseYOffset, 2, 0); //cyan to upper-right bedroom
  moveCue(1, 26, 30, ladyLilac, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //lilac to third floor
  moveCue(1, 26, 45, profPuce, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //puce to third floor
  snapCue(1, 27, 15, mrsMaroon, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //maroon snap to third floor
  turnCue(1, 27, 15, mrsMaroon, -1); //maroon turns right
  moveCue(1, 27, 15, mrsMaroon, windowPositions[1][4][0] + houseXOffset + archWindowWidth/2, windowPositions[1][4][1] + houseYOffset, 2, 0); //maroon to upper-right bedroom
  snapCue(1, 27, 30, ladyLilac, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //lilac snap to third floor
  turnCue(1, 27, 30, ladyLilac, -1); //lilac turns right
  moveCue(1, 27, 30, ladyLilac, windowPositions[1][5][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][5][1] + houseYOffset, 2, 0); //lilac to upper right bedroom
  moveCue(1, 27, 30, drDrab, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, -2); //drab to third floor
  snapCue(1, 27, 45, profPuce, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //puce snap to third floor
  turnCue(1, 27, 45, profPuce, -1); //puce turns right
  moveCue(1, 27, 45, profPuce, windowPositions[1][4][0] + houseXOffset - archWindowWidth/2, windowPositions[1][4][1] + houseYOffset, 2, 0); //puce to upper-right bedroom
  snapCue(1, 28, 30, drDrab, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset); //drab snap to third floor
  turnCue(1, 28, 30, drDrab, -1); //drab turns right
  moveCue(1, 28, 30, drDrab, windowPositions[1][4][0] + houseXOffset, windowPositions[1][4][1] + houseYOffset, 2, 0); //drab to upper-right bedroom
  animationCue(1, 28, 45, furnitureSprites[1][1], `opening`); //open the door
  animationCue(1, 29, 15, furnitureSprites[1][1], `closing`); //close the door
  moveCue(1, 29, 0, cptCobalt, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset, 2, 0); //cobalt to top of the stairs
  snapCue(1, 29, 15, cptCobalt, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset + archWindowHeight/3); //cobalt snap to third floor
  animationCue(1, 29, 45, furnitureSprites[1][1], `closed`); //the door is closed
  moveCue(1, 29, 15, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, 2); //cobalt descending stairs to second floor
  snapCue(1, 30, 15, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //cobalt snapping to second floor
  turnCue(1, 30, 15, cptCobalt, 1); //cobalt turns left
  moveCue(1, 30, 15, cptCobalt, windowPositions[2][0][0] + houseXOffset, windowPositions[2][0][1] + houseYOffset, -2, 0); //cobalt to lower-left bedroom
  animationCue(1, 30, 45, furnitureSprites[2][1], `opening`); //open the door
  animationCue(1, 31, 15, furnitureSprites[2][1], `open`); //the door is open
  turnCue(1, 32, 0, sirCyan, 1); //cyan turns left
  moveCue(1, 32, 0, sirCyan, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][2][1] + houseYOffset, -2, 0); //cyan to upper-left bedroom
  snapCue(1, 33, 0, cptCobalt, windowPositions[2][0][0] + houseXOffset, windowPositions[2][0][1] + houseYOffset + archWindowHeight/3); //cobalt kneels
  turnCue(1, 34, 0, drDrab, 1); //drab turns left
  moveCue(1, 34, 0, drDrab, windowPositions[1][1][0] + houseXOffset - archWindowWidth/1.5, windowPositions[1][1][1] + houseYOffset, -2, 0); //drab to upper-left bedroom
  snapCue(1, 34, 30, cptCobalt, windowPositions[2][0][0] + houseXOffset, windowPositions[2][0][1] + houseYOffset); //cobalt stands up
  turnCue(1, 35, 0, cptCobalt, -1); //cobalt turns right
  moveCue(1, 35, 0, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, 0); //cobalt to second-floor hallway
  turnCue(1, 35, 0, profPuce, 1); //puce turns left
  moveCue(1, 35, 30, profPuce, windowPositions[1][3][0] + houseXOffset, windowPositions[1][3][1] + houseYOffset, -1, 0); //puce to hallway
  moveCue(1, 36, 0, ladyLilac, windowPositions[1][5][0] + houseXOffset, windowPositions[1][5][1] + houseYOffset, 1, 0); //lilac across bedroom
  animationCue(1, 36, 0, furnitureSprites[1][1], `opening`); //open the door
  moveCue(1, 36, 15, sirCyan, windowPositions[1][0][0] + houseXOffset, windowPositions[1][0][1] + houseYOffset, -2, 0); //cyan to upper-left bedroom
  animationCue(1, 36, 15, furnitureSprites[1][1], `open`); //the door is open
  moveCue(1, 37, 0, mrsMaroon, windowPositions[1][5][0] + houseXOffset - archWindowWidth/2, windowPositions[1][5][1] + houseYOffset, 1, 0); //puce to hallway
  snapCue(1, 37, 45, cptCobalt, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset + archWindowHeight/3); //cobalt snapping to second floor stairs
  moveCue(1, 37, 45, cptCobalt, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset, -2, 2); //cobalt to first floor
  turnCue(1, 37, 45, cptCobalt, 1); //cobalt turns left
  turnCue(1, 38, 30, sirCyan, -1); //cyan turns right
  moveCue(1, 38, 30, sirCyan, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset, 2, 0); //cyan to top of the stairs
  snapCue(1, 38, 45, cptCobalt, windowPositions[3][2][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][2][1] + houseYOffset); //cobalt snapping to first floor
  moveCue(1, 38, 45, cptCobalt, windowPositions[3][0][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][0][1] + houseYOffset, -2, 0); //cobalt to front door
  turnCue(1, 39, 0, profPuce, -1); //puce turns right
  turnCue(1, 39, 30, drDrab, 1); //drab turns right
  snapCue(1, 39, 45, sirCyan, windowPositions[1][2][0] + houseXOffset - archWindowWidth/1.25, windowPositions[1][2][1] + houseYOffset + archWindowHeight/3); //cyan snapping to top of stairs
  moveCue(1, 39, 45, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset, 2, 2); //cyan descending stairs to second floor
  snapCue(1, 41, 0, sirCyan, windowPositions[2][2][0] + houseXOffset + archWindowWidth/1.5, windowPositions[2][2][1] + houseYOffset); //cyan snapping to second floor
  turnCue(1, 41, 0, sirCyan, 1); //cyan turns left
  moveCue(1, 41, 0, sirCyan, windowPositions[2][0][0] + houseXOffset, windowPositions[2][0][1] + houseYOffset, -2, 0);
  snapCue(1, 41, 0, cptCobalt, windowPositions[3][0][0] + houseXOffset - archWindowWidth, windowPositions[3][0][1] + houseYOffset + archWindowHeight); //cobalt snaps to outside
  moveCue(1, 41, 0, cptCobalt, windowPositions[3][0][0] + houseXOffset - archWindowWidth/1.5, windowPositions[3][0][1] + houseYOffset, -3, 0); //cobalt absconding
}


// displayHouseForeground()
// a function that draws the parts of the house in front of the plane of the sprites
function displayHouseForeground() {
  //drawing the house facade grid that masks the space between windows
  fill(30, 0, 0);
  //vertical bars
  for (let i = 0; i < 5; i++) {
    rect(
        houseXOffset + windowPositions[3][0][0]*2*(i+1),     //X position
        houseYOffset + houseHeight /1.5,                     //Y position
        archWindowWidth,                                     //width
        houseHeight);                                        //height
  }
  for (let i = 0; i < 2; i++) {
    rect(
        houseXOffset + houseWidth/48 + i*(houseWidth*46/48), //X position
        houseYOffset + houseHeight /1.5,                     //Y position
        archWindowWidth/2,                                   //width
        houseHeight);                                        //height
  }
  //horizontal bars
  for (let i = 0; i < 3; i++) {
    rect(
        houseXOffset + houseWidth/2,                          //X position
        houseYOffset + houseHeight/3.75 + (i)*houseHeight/4,  //Y position
        houseWidth,                                           //width
        houseHeight/18);                                      //height
  }

  //draw the roof
  fill(60, 80, 60);
  quad(  //draw the parallelogram that is the roof
      width/2 - houseWidth/2, height/4.5,                                 //upper left corner X and Y coordinates
      width/2 + houseWidth/2, height/4.5,                                 //upper right corner X and Y coordinates
      width/2 + houseWidth/2 + width/48, height/4.5 + houseHeight/3.5,    //lower right corner X and Y coordinates
      width/2 - houseWidth/2  - width/48, height/4.5 + houseHeight/3.5);  //lower left corner X and Y coordinates

  //draw the false roof windows
  for (let j = 0; j < 6; j++) {
    //window frame slightly bigger than window opening
    fill(250, 250, 180);
    rect(
        houseXOffset + windowPositions[0][j][0],  //X position
        houseYOffset + windowPositions[0][j][1],  //Y position
        houseWidth/10,                            //width
        houseHeight/5.25);                        //height

    //window openings
    if (windowLights[0][j] == 0) {
      fill(0, 0, 30); //dark
    } else {
      fill(200, 200, 100); //light
    }
      rect(
        houseXOffset + windowPositions[0][j][0],  //X position
        houseYOffset + windowPositions[0][j][1],  //Y position
        archWindowWidth,                          //width
        archWindowHeight);                        //height
  }

  for (let i = 1; i < 4; i++) {
    for (let j = 0; j < 6; j++) {
      //window frame slightly bigger than window opening
      fill(250, 250, 180);
      //left
      rect(
          houseXOffset + windowPositions[i][j][0] - archWindowWidth/1.85,  //X position
          houseYOffset + windowPositions[i][j][1],                         //Y position
          (houseWidth/10-archWindowWidth)/2,                               //width
          houseHeight/5.25);                                               //height
      //right
      rect(
          houseXOffset + windowPositions[i][j][0] + archWindowWidth/1.85,  //X position
          houseYOffset + windowPositions[i][j][1],                         //Y position
          (houseWidth/10-archWindowWidth)/2,                               //width
          houseHeight/5.25);                                               //height
      //top
      rect(
          houseXOffset + windowPositions[i][j][0],                         //X position
          houseYOffset + windowPositions[i][j][1] - archWindowHeight/1.9,  //Y position
          houseWidth/10.5,                                                 //width
          (houseHeight/5.25-archWindowHeight)/1.6);                        //height

      //window sills
      fill(80, 80, 100);
      let windowSillOffset = height*0.0685; //offset to bottom edge of window
      rect(
          houseXOffset + windowPositions[i][j][0],                      //X position
          houseYOffset + windowPositions[i][j][1] + windowSillOffset,   //Y position
          houseWidth/9,                                                 //width
          houseHeight/32);                                              //height
    }
  }
}


// displayFocus
// a function that draws the dashed box to indicate on which window you're "focused"
function displayFocus() {
  //draw a dashed outline
  push();
  stroke(200);
  //top
  for (let i = 0; i < 20; i = i + 2) {
    line(
        originX - houseWidth/12 + houseWidth*(i)/114,    //Point A X coordinate
        originY - houseHeight/8,                         //Point A Y coordinate
        originX - houseWidth/12 + houseWidth*(i+1)/114,  //Point B X coordinate
        originY - houseHeight/8);                        //Point B Y coordinate
  }
  //left
  for (let i = 0; i < 20; i = i + 2) {
    line(
        originX - houseWidth/12,                         //Point A X coordinate
        originY - houseHeight/8 + houseHeight*(i)/76,    //Point A Y coordinate
        originX - houseWidth/12,                         //Point B X coordinate
        originY - houseHeight/8 + houseHeight*(i+1)/76); //Point B Y coordinate
  }
  for (let i = 0; i < 20; i = i + 2) {
    line(
        originX + houseWidth/12,                         //Point A X coordinate
        originY - houseHeight/8 + houseHeight*(i)/76,    //Point A Y coordinate
        originX + houseWidth/12,                         //Point B X coordinate
        originY - houseHeight/8 + houseHeight*(i+1)/76); //Point B Y coordinate
  }
  //bottom
  for (let i = 0; i < 20; i = i + 2) {
    line(
        originX - houseWidth/12 + houseWidth*(i)/114,    //Point A X coordinate
        originY + houseHeight/8,                         //Point A Y coordinate
        originX - houseWidth/12 + houseWidth*(i+1)/114,  //Point B X coordinate
        originY + houseHeight/8);                        //Point B Y coordinate
  }
  pop();
}


// displayFilmRemaining()
// a function that draws the number of photos you have left to take
function displayFilmRemaining() {
  image(filmRoll, 0, 0, width/6, height/5.5); //display the film roll image as a background for the number
  push();
  textFont(gameFont);
  textAlign(CENTER);
  textSize(width/10);
  fill(255);
  text(filmRemaining, width/12, height/7); //display film remaining in the upper left corner
  pop();
}


// displayCameraBarrel()
// a function that draws the masking simulating the field of view of a camera barrel
function displayCameraBarrel() {
  push();
  noFill();
  strokeWeight(100);
  stroke(0);
  circle(originX, originY, width*0.2);
  pop();
}


// displayGlare()
// a function that draws the glare and fades it when you take a pictues
function displayGlare() {
  //fade the flash from taking a photo
  if (glare > 0) {
    glare--;
    push();
    fill(`rgba(255,255,255,${glare/50})`); //slowly fade the glare with alpha value
    rect(width/2, height/2, width, height); //draw the white glare overlay the size of the screen and centered
    pop();
  }

  //if a photo has been taken, create a new flash effects
  if (snapshotBuffer) {
    snapshotBuffer = false;
    filmRemaining--; //reduce film left
    photo.push(get(0, 0, width, height)); //save the snapshot to the photo array
    glare = 50; //create the flashbulb effect
    flashbulb.play(); //flash sound effect
  }
}


// checkZoom()
// a function that conviently checks for a zoomed state from either the keyboard or the camera controller
function checkZoom() {
  if (keyIsDown(SHIFT)) {
    return true; //if shift is pressed, zoom
  } else if (peripheralConnected && !lightSensor) {
    return true; //if the camera is sending data and the lightsensor is blocked, zoom
  } else {
    return false; //otherwise do nothing
  }
}


// moveCue(minutes, second, frame, character, posX, posY, velX, velY)
// a function triggered at minute:second:frame to start moving character to (posX, posY) at (velX, velY) volocity
function moveCue(minute, second, frame, character, posX, posY, velX, velY) {
  if (minutes == minute && seconds == second && frames == frame) { //make sure the cue only happens on cue
    //give the character a new position to move to
    character.targetX = posX;
    character.targetY = posY;
    //set the speed at which you want them to move
    character.dx = velX;
    character.dy = velY;
    character.moving = 1; //start them moving
  }
}


// turnCue(minute, second, frame, character, dir)
// a function triggered minute:second:frame to make character look in direction dir
function turnCue(minute, second, frame, character, dir) {
  if (minutes == minute && seconds == second && frames == frame) {
    character.orientation = dir;
  }
}


// snapCue(minute, second, frame, character, xPos, yPos)
// a function that triggers at minute:second:frame and snaps character to position (xPos, yPos) and stops them moving
function snapCue(minute, second, frame, character, xPos, yPos) {
  if (minutes == minute && seconds == second && frames == frame) {
    character.sprite.position.x = xPos;
    character.sprite.position.y = yPos;
    character.moving = 0;
  }
}


// lightCue(minute, second, frame, room, value)
// a function that toggles the "lighting" to value in room at time minute:second:frame
function lightCue(minute, second, frame, room, value) {
  if (minutes == minute && seconds == second && frames == frame) {
    //arbitrary room numbering for the sake of simple groupings
    if (room == 1) { //lower-left bedroom
      windowLights[2][0] = value;
      windowLights[2][1] = value;
    } else if (room == 2) { //lower-right bedroom
      windowLights[2][4] = value;
      windowLights[2][5] = value;
    } else if (room == 3) { //upper-left bedroom
      windowLights[1][0] = value;
      windowLights[1][1] = value;
    } else if (room == 4) { //upper-right bedroom
      windowLights[1][4] = value;
      windowLights[1][5] = value;
    }
  }
}


// animationCue(minute, second, frame, sprite, `animation`)
// a function that changes sprite to `animation` at time minute:second:frame
function animationCue(minute, second, frame, sprite, animation) {
  if (minutes == minute && seconds == second && frames == frame) {
    sprite.changeAnimation(animation); //change the animation
  }
}


// soundCue(minute, second, frame, sound)
// a function that plays sound at time minute:second:frame
function soundCue(minute, second, frame, sound) {
  if (minutes == minute && seconds == second && frames == frame) {
    sound.play(); //play the sound
  }
}


// assignPhotoPositions()
// a function to randomly generate positions and rotations for the photos you take
function assignPhotoPositions() {
  if (photoPositionsAssigned == 0) { //check to see if this has been done already
    for (let i = 0; i < photo.length; i++) {
      randomRotation.push(random(-30, 30)); //generate a random angle
      randomX.push(width/2 + random(-width/8, width/8)); //generate a random X offset
      randomY.push(height/2 + random(-height/8, height/8)); //generate a random Y offset
    }
    photoPositionsAssigned = 1; //don't do this again if it's already been done
  }
}


// displayDarkroomBackground()
// a function that draws the background for the darkroom
function displayDarkroomBackground() {
  push();
  rectMode(CENTER);
  fill(20, 10, 0); //dark brown
  rect(width/2, height/2, width, height);
  pop();
}


// displayPhotos()
// draws the photos you've taken
function displayPhotos() {
  push();
  fill(200); //light grey
  rectMode(CENTER);
  imageMode(CENTER);
  angleMode(DEGREES);
  noStroke();
  for (let i = 0; i < photo.length; i++) {
    rotate(randomRotation[i]); //set rotation
    rect(randomX[i], randomY[i], width/4, (9*width)/64); //draw a grey rectangle for the picture border
    image(photo[i], randomX[i], randomY[i], (width/4)-width/50, ((9*width)/64)-width/50); //draw the picture
  }
  pop();
}


// darkroomOverlay()
// draws a red tint over the screen
function darkroomOverlay() {
  push();
  rectMode(CENTER);
  fill(`rgba(30, 0, 0, 0.75)`); //dark red
  rect(width/2, height/2, width, height);
  pop();
}


// displayDarkroomText()
// draws the text for the final screen
function displayDarkroomText() {
  push();
  fill(255,255,255);
  textSize(70);
  textFont(`Courier`);
  textAlign(LEFT);
  text(`What do you think happened?`, width/16, height/6);
  textSize(50);
  textAlign(RIGHT);
  text(`Press spacebar to play again`, 15*width/16, 5*height/6);
  pop();
}
