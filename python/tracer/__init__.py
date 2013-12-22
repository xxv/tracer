#!/usr/bin/env python

# Tracer Solar Regulator interface for MT-5 display
#
# Based on document by alexruhmann@body-soft.de
#   document version 3, 2011-12-13
#
# Verified on SainSonic MPPT Tracer 1215RN Solar Charge Controller
#   Regulator 12/24V INPUT 10A
#

class Result(object):
    def __init__(self, data):
        self.data = data
        self.decode(data)

    def decode(self, data):
        pass

    def to_float(self, two_bytes):
        """Convert a list of two bytes into a floating point value."""
        # convert two bytes to a float value
        return ((two_bytes[1] << 8) | two_bytes[0]) / 100.0

class QueryResult(Result):
    def decode(self, data):
        """Decodes the query result, storing results as fields"""
        self.batt_voltage = self.to_float(data[0:2])
        self.pv_voltage = self.to_float(data[2:2])
        # [4:2] reserved; always 0
        self.load_amps = self.to_float(data[6:2])
        self.batt_overdischarge_voltage = self.to_float(data[8:2])
        self.batt_full_voltage = self.to_float(data[10:2])
        self.load_on = data[12] != 0
        self.load_overload = data[13] != 0
        self.load_short = data[14] != 0
        # data[15] reserved; always 0
        self.batt_overload = data[16] != 0
        self.batt_overdischarge = data[17] != 0
        self.batt_full = data[18] != 0
        self.batt_charging = data[19] != 0
        self.batt_temp = data[20] - 30;
        self.charge_current = self.to_float(data[21:2])

class Command(object):
    def __init__(self, code, data= []):
        self.code = code
        self.data = data
    def decode_result(self, data):
        pass

class QueryCommand(Command):
    def __init__(self):
        Command.__init__(self, 0xA0)
    def decode_result(self, data):
        return QueryResult(data)

class ManualCommand(Command):
    def __init__(self, state):
        if state:
            data = [0x01]
        else:
            data = [0x00]
        Command.__init__(self, 0xAA, data)

class TracerSerial(object):
    comm_init = [0xAA, 0x55] * 3 + [0xEB, 0x90] * 3

    def __init__(self, tracer, port):
        self.tracer = tracer
        self.port = port

    def to_bytes(self, command):
        cmd_data = self.tracer.get_command_bytes(command) + [0x00, 0x00, 0x7F]
        crc_data = self.tracer.add_crc(cmd_data)
        to_send = self.comm_init + crc_data

        return to_send

class Tracer(object):
    def __init__(self, controller_id):
        self.controller_id = controller_id

    def get_command_bytes(self, command):
        data = []
        data.append(self.controller_id)
        data.append(command.code)
        data.append(len(command.data))
        data += command.data

        return data

    def verify_crc(self, data):
        verify = self.add_crc(data)

        return data == verify

    def add_crc(self, data):
        """Returns a copy of the data with the CRC added"""
        data = list(data)
        # the input CRC bytes must be zeroed
        data[data[2] + 3] = 0
        data[data[2] + 4] = 0
        crc = self.crc(data, data[2] + 5)
        data[data[2] + 3] = crc >> 8
        data[data[2] + 4] = crc & 0xFF

        return data

    def crc(self, data, crc_len):
        """Calculates the Tracer CRC for the given data"""
        i = j = r1 = r2 = r3 = r4 = 0
        result = 0

        r1 = data[0]
        r2 = data[1]
        crc_buff = 2

        for i in range(0, crc_len - 2):
            r3 = data[crc_buff]
            crc_buff += 1

            for j in range(0, 8):
                r4 = r1
                r1 = (r1 * 2) & 0xFF;

                if r2 & 0x80:
                    r1 += 1
                r2 = (r2 * 2) & 0xFF;

                if r3 & 0x80:
                    r2 += 1
                r3 = (r3 * 2) & 0xFF;

                if r4 & 0x80:
                    r1 ^= 0x10
                    r2 ^= 0x41

        result = (r1 << 8) | r2

        return result
