/*
 * Kytkennät Arduinolle: 
 * 
 * BMP280: GND->GND, Vcc->3.3V, SCL->A5, SDA->A4, ADDRESS:
 * Venus GPS: 
 * 
 */

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <SoftwareSerial.h>

#define BMP280 0x76
#define GPM 0x68

byte Address;
byte Data; 

String msg = "";

SoftwareSerial gpsSerial(10, 11); //RX, (TX)
const int sentenceSize = 80;
char sentence[sentenceSize];

Adafruit_BMP280 bme; // I2C
  
void setup() {
  noInterrupts();
  
  interrupts();
  Wire.begin();
  Serial.begin(9600);
  
  if (!bme.begin()) {  
    Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    while (1);
  }
  
}
  
void loop()
{

  msg = "";
    for(Address = 14; Address < 33; Address++)
    {
    Data = GetSingle();
    msg += (int) Data;  
    
    if(Address == 17 || Address == 27)
    {
      msg += ".";
    }
    
    if(Address == 15 || Address == 22 || Address == 25 || Address == 32)
    {
      msg += ", ";
    }
    }
  msg += bme.readPressure();
  Serial.println(msg);
  
  delay(1000);
}

int GetSingle(){              // Get single register value from GPM

  int Value = 0; 

  Wire.beginTransmission(GPM);
  Wire.write(Address);              // Send register start address
  Wire.endTransmission();

  Wire.requestFrom(GPM, 1);           // Request register
  while(Wire.available() < 1);            // Wait for single byte
  Value = Wire.read();                                // and store

  return(Value);                            
}