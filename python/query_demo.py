#!/usr/bin/env python

import serial
from tracer import Tracer, TracerSerial, QueryCommand, ManualCommand

fake = None
# A sample response, to show what this demo does. Uncomment to use.
#fake = bytearray(b'\xEB\x90\xEB\x90\xEB\x90\x00\xA0\x18\xD2\x04\xD3\x04\x00\x00\x0E\x00\x53\x04\xA5\x05\x01\x00\x00\x1F\x00\x00\x00\x01\x33\x0A\x00\x00\x99\x5B\x7F')

class FakePort(object):
    def __init__(self, data):
        self.data = data
    read_idx = 0
    def read(self, count=1):
        result = self.data[self.read_idx:self.read_idx+count]
        self.read_idx += count
        return result
    def write(self, data):
        return len(data)

if not fake:
    ser = serial.Serial('/dev/ttyAMA0', 9600, timeout = 1)
else:
    ser = FakePort(fake)

tracer = Tracer(0x16)
t_ser = TracerSerial(tracer, ser)
query = QueryCommand()
t_ser.send_command(query)
result = t_ser.receive_result()

print "Raw bytes: %s" % ", ".join(map(lambda a: "%0X" % (a), result.data))
print
formatted = str(result).replace('{', '{\n')
formatted = formatted.replace('}', '\n}')
print formatted.replace(', ', '\n')

