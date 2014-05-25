#!/usr/bin/env python

import serial
from tracer import Tracer, TracerSerial, QueryCommand, ManualCommand

tracer = Tracer(0x16)

fake = bytearray([0xEB, 0x90, 0xEB, 0x90, 0xEB, 0x90, 0x0, 0xA0, 0x18, 0xBE, 0x4, 0xB5, 0x4, 0x0, 0x0, 0xE, 0x0, 0x53, 0x4, 0xA5, 0x5, 0x1, 0x0, 0x0, 0x1F, 0x0, 0x0, 0x0, 0x0, 0x33, 0x0, 0x0, 0x0, 0x99, 0x5B, 0x7F])
fake = None

query = QueryCommand()

t_ser = TracerSerial(tracer, "")
if not fake:
    ser = serial.Serial('/dev/ttyAMA0', 9600, timeout = 1)
    ser.write(bytearray(t_ser.to_bytes(query)))
    data = bytearray(ser.read(200))
else:
    data = fake

print "Read %d bytes" % len(data)
print ", ".join(map(lambda a: "%0X" % (a), data))
result = t_ser.from_bytes(data)

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

