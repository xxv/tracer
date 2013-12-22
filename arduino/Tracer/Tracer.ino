/*
 * An interface to the Tracer solar regulator.
 * Communicating in a way similar to the MT-5 display
 */
#include <SoftwareSerial.h>

SoftwareSerial myserial(10, 11); // RX, TX

uint8_t start[] = { 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55,
										0xEB, 0x90, 0xEB, 0x90, 0xEB, 0x90 };
uint8_t id = 0x16;
uint8_t cmd[] = { 0xA0, 0x00, 0xB1, 0xA7, 0x7F };

uint8_t buff[128];

void setup() {
	Serial.begin(57600);

	myserial.begin(9600);
}

float to_float(uint8_t* buffer, int offset){
	unsigned short full = buffer[offset+1] << 8 | buff[offset];

	return full / 100.0;
}


void loop() {
	Serial.println("Reading from Tracer");

	myserial.write(start, sizeof(start));
	myserial.write(id);
	myserial.write(cmd, sizeof(cmd));

	int read = 0;

	for (int i = 0; i < 255; i++){
		if (myserial.available()) {
			buff[read] = myserial.read();
			read++;
		}
	}

	Serial.print("Read ");
	Serial.print(read);
	Serial.println(" bytes");

	for (int i = 0; i < read; i++){
			Serial.print(buff[i], HEX);
			Serial.print(" ");
	}

	Serial.println();

	float battery = to_float(buff, 9);
	float pv = to_float(buff, 11);
	//13-14 reserved
	float load_current = to_float(buff, 15);
	float over_discharge = to_float(buff, 17);
	float battery_max = to_float(buff, 19);
	// 21 load on/off
	// 22 overload yes/no
	// 23 load short yes/no
	// 24 reserved
	// 25 battery overload
	// 26 over discharge yes/no
	uint8_t full = buff[27];
	uint8_t charging = buff[28];
	int8_t battery_temp = buff[29] - 30;
	float charge_current = to_float(buff, 30);

	Serial.print("Load is ");
	Serial.println(buff[21] ? "on" : "off");

	Serial.print("Load current: ");
	Serial.println(load_current);

	Serial.print("Battery level: ");
	Serial.print(battery);
	Serial.print("/");
	Serial.println(battery_max);

	Serial.print("Battery full: ");
	Serial.println(full ? "yes " : "no" );

	Serial.print("Battery temperature: ");
	Serial.println(battery_temp);

	Serial.print("PV voltage: ");
	Serial.println(pv);

	Serial.print("Charging: ");
	Serial.println(charging ? "yes" : "no" );

	Serial.print("Charge current: ");
	Serial.println(charge_current);

	delay(1000);
}

