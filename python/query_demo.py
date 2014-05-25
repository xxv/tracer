#!/usr/bin/env python

import serial
from tracer import Tracer, TracerSerial, QueryCommand, ManualCommand

tracer = Tracer(0x16)

ser = serial.Serial('/dev/ttyAMA0', 9600, timeout = 1)
t_ser = TracerSerial(tracer, "")
query = QueryCommand()
ser.write(bytearray(t_ser.to_bytes(query)))

data = bytearray(ser.read(200))
print "Read %d bytes" % len(data)
print ", ".join(map(lambda a: "%0X" % (a), data))
result = query.decode_result(data)

#print "CRC %s" % tracer.verify_crc(data)
print "PV voltage %s" % result.pv_voltage
print "Battery voltage %s" % result.batt_voltage
print "Load is %s" % result.load_on
print "Load short %s" % result.load_short
print "Load amps %s" % result.load_amps
print "Load overload %s" % result.load_overload
print "Battery charging is %s" % result.batt_charging
print "Battery full is %s" % result.batt_charging
print "Battery overload is %s" % result.batt_overload
print "Battery overdischarge is %s" % result.batt_overdischarge
print "Battery temp is %s" % result.batt_temp
print "Charge current is %s" % result.charge_current

