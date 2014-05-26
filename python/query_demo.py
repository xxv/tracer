#!/usr/bin/env python

import serial
from tracer import Tracer, TracerSerial, QueryCommand, ManualCommand

tracer = Tracer(0x16)

fake = None
# A sample response, to show what this demo does. Uncomment to use.
# fake = bytearray(b'\xEB\x90\xEB\x90\xEB\x90\x00\xA0\x18\xD2\x04\xD3\x04\x00\x00\x0E\x00\x53\x04\xA5\x05\x01\x00\x00\x1F\x00\x00\x00\x01\x33\x0A\x00\x00\x99\x5B\x7F')

query = QueryCommand()

t_ser = TracerSerial(tracer, "")
if not fake:
    ser = serial.Serial('/dev/ttyAMA0', 9600, timeout = 1)
    ser.write(t_ser.to_bytes(query))
    data = bytearray(ser.read(200))
else:
    data = fake

print "Read %d bytes" % len(data)
print ", ".join(map(lambda a: "%0X" % (a), data))
result = t_ser.from_bytes(data)
print result

print "PV voltage %s" % result.pv_voltage
print "Battery voltage %s" % result.batt_voltage
print "Load is %s" % result.load_on
print "Load short %s" % result.load_short
print "Load amps %s" % result.load_amps
print "Load overload %s" % result.load_overload
print "Battery charging is %s" % result.batt_charging
print "Battery full is %s" % result.batt_full
print "Battery overload is %s" % result.batt_overload
print "Battery overdischarge is %s" % result.batt_overdischarge
print "Battery temp is %s" % result.batt_temp
print "Charge current is %s" % result.charge_current

