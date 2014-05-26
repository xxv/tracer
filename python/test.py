from tracer import Result, QueryResult, Command, QueryCommand, ManualCommand, TracerSerial, Tracer
from unittest2 import TestCase
import unittest2
from mock import Mock

fixture_float_bytes=bytearray(b'\xD2\x04')
fixture_data=bytearray(b'\x41\x42\x43')
query_result = bytearray(b'\xD2\x04\xD3\x04\x00\x00\x0E\x00\x53\x04\xA5\x05\x01\x00\x00\x1F\x00\x00\x00\x00\x33\x0A\x00\x00\x99\x5B\x7F')
full_query_result = bytearray(b'\xEB\x90\xEB\x90\xEB\x90\x00\xA0\x18') + query_result
class TestResult(TestCase):
    def test_to_float(self):
        r=Result("")
        self.assertEqual(12.34, r.to_float(fixture_float_bytes))

def assertQueryResult(self, qr):
    self.assertEqual(12.34, qr.batt_voltage)
    self.assertEqual(12.35, qr.pv_voltage)
    self.assertEqual(0.14, qr.load_amps)
    self.assertEqual(11.07, qr.batt_overdischarge_voltage)
    self.assertEqual(14.45, qr.batt_full_voltage)
    self.assertEqual(True, qr.load_on)
    self.assertEqual(False, qr.load_overload)
    self.assertEqual(False, qr.load_short)
    self.assertEqual(False, qr.batt_overload)
    self.assertEqual(False, qr.batt_overdischarge)
    self.assertEqual(False, qr.batt_full)
    self.assertEqual(False, qr.batt_charging)
    self.assertEqual(21, qr.batt_temp)
    self.assertEqual(0.1, qr.charge_current)

class TestQueryResult(TestCase):
    def test_decode(self):
        qr = QueryResult(query_result)
        assertQueryResult(self, qr)

class TestTracerSerial(TestCase):
    def setUp(self):
        tracer = Tracer(16)
        tracer.get_command_bytes=Mock(return_value=fixture_data)
        tracer.add_crc = Mock(return_value=fixture_data)
        tracer.verify_crc = Mock(return_value=True)
        tracer.get_result = Mock(return_value=Command(0x12, fixture_data))
        self.ts = TracerSerial(tracer, None)

    def test_to_bytes(self):
        command = Command(0x12)
        command.decode_result = Mock()
        result = self.ts.to_bytes(command)
        self.assertEqual(bytearray(b'\xAA\x55\xAA\x55\xAA\x55\xEB\x90\xEB\x90\xEB\x90' + fixture_data), result)

    def test_from_bytes(self):
        result = self.ts.from_bytes(bytearray(b'\xEB\x90\xEB\x90\xEB\x90\x00\x12\x03'+fixture_data + '\x00\x00\x7A'))
        self.assertEqual(fixture_data, result.data)

    def test_receive_result(self):
        class FakePort(object):
            def __init__(self, data):
                self.data = data
            read_idx = 0
            def read(self, count=1):
                result = self.data[self.read_idx:self.read_idx+count]
                self.read_idx += count
                return result
        self.ts.port = FakePort(full_query_result)
        self.ts.from_bytes = Mock(return_result=QueryResult(query_result))

        # make the actual call
        result = self.ts.receive_result()

        self.assertNotEqual(None, result)
        self.ts.from_bytes.assert_called_with(full_query_result)

class TestTracer(TestCase):
    def setUp(self):
        self.t = Tracer(16)

    def test_get_command_bytes(self):
        result = self.t.get_command_bytes(Command(0x12, fixture_data))
        self.assertEqual(bytearray(b'\x10\x12\x03' + fixture_data), result)

    def test_get_result(self):
        result = self.t.get_result(bytearray(b'\x00\xA0\x18') + query_result)
        self.assertEqual(QueryResult, type(result))

if __name__ == '__main__':
    unittest2.main()
