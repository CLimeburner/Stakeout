/*
  REAR WINDOW CAMERA PERIPHERAL
  Chip Limeburner

  This is code to run off an arduino microprocessor that provides the functionality for a tangible camera accesory. 
  The controller takes seven conceptual inputs, 4-directional buttons, a photoresistor to detect when the camera is 
  held up in front of the face, and a rotary encoder that provides both rotational information and a momentary switch.
  Additionally, it has one output: an indicator LED.

  Users can use the directional pad to navigate, bring the camera up to their face to "zoom in" and the rotary encoder 
  to "wind" their film and take pictures.
*/

//assign pins for the buttons
const int upPin = 2;
const int downPin = 3;
const int leftPin = 4;
const int rightPin = 5;
const int indicatorPin = 6;
const int CLK = 7;
const int DT = 8;
const int SW = 9;

int counter = 0; //counter to track how much the rotary encoder has been turned
int currentStateCLK; //track current state of the CLK pin
int lastStateCLK; //store previous state of the CLK pin for comparison
int btnState; //variable for reading if the rotary encoder has been clicked

int up = 0; //binary indicator of up button being pressed
int down = 0; //binary indicator of down button being pressed
int left = 0; //binary indicator of left button being pressed
int right = 0; //binary indicator of right button being pressed
int snap = 0; //binary indicator of snap button being pressed

int sensorValue; //the raw analog value from the photoresistor

int sensorHigh = 0; //binary representation of if the photoresistor is "high" or "low" based on an experimentally determined cutoff

int serialOutputByte = 0; //variable to store the byte to send to the server


// setup()
// function that initializes and starts the material we'll need in the main loop.
void setup() {
  Serial.begin(9600); //start the serial output

  //initialize button pins
  pinMode(upPin, INPUT);
  pinMode(downPin, INPUT);
  pinMode(leftPin, INPUT);
  pinMode(rightPin, INPUT);
  pinMode(indicatorPin, OUTPUT);
  pinMode(CLK,INPUT);
  pinMode(DT,INPUT);
  pinMode(SW, INPUT_PULLUP);

  lastStateCLK = digitalRead(CLK); // Read the initial state of the CLK pin
}


// loop()
// function that will loop endlessless. Pulls our input data and formats it to be passed to the server.
void loop() {

  snap = 0; //reset the snap bit

  currentStateCLK = digitalRead(CLK); // Read the current state of CLK

  //check to see if the rotary encoder has been turned. If so, increment the counter. 
  if (currentStateCLK != lastStateCLK  && currentStateCLK == 1 && digitalRead(DT) != currentStateCLK){
    counter ++;
  }

  //if the counter tracking rotary encoder rotation is high enough, turn on the LED at pin 6
  if(counter >= 10) {
    digitalWrite(indicatorPin, HIGH);
  } else {
    digitalWrite(indicatorPin, LOW);
  }

  lastStateCLK = currentStateCLK; // Remember last CLK state

  //read the pin values
  up = !digitalRead(upPin);
  down = !digitalRead(downPin);
  left = !digitalRead(leftPin);
  right = !digitalRead(rightPin);
  btnState = digitalRead(SW);
  
  sensorValue = analogRead(A0); //read the analog value from the photoresistor

  //translate the analog photoresistor value to a digital one
  if (sensorValue > 600) {
    sensorHigh = 1;
  } else {
    sensorHigh = 0;
  }

  //If we detect LOW signal, button is pressed
  if (btnState == LOW && counter > 4) {
     counter = 0;
     snap = 1;
  }

  serialOutputByte = (1*up) + (2*down) + (4*left) + (8*right) + (16*sensorHigh) + (32*snap); //convert all our binary values to a passable byte

  Serial.write(serialOutputByte); //output byte
  
  delay(10); //wait a bit
}
