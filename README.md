Communication Interface for Tracer MT-5
=======================================

This is an Arduino and Python library for interfacing with the SainSonic Tracer
series solar charge regulators.

This was designed to work with a "SainSonic MPPT Tracer 1215RN Solar Charge
Controller Regulator 12/24V INPUT 10A"

The protocol is described in [Protocol Tracer MT-5][tracer-doc] (copy here in
`docs/`) and implemented in Python and Arduino. There's also a copy of the C
CRC as stated in the docs by itself with a test.

Physical Interface
------------------

The Tracer uses an [8P8C][] connector (the same physical type of connector as
RJ-45 Ethernet cables, but very much not an Ethernet connection).

Pinout
------

Pin 1 is on the left when looking at the connector with the contacts facing
forward. See [8P8C][] for an example of the physical connector and location of
pin 1.

1. +12V (seems to be regulated)
2. Gnd (common to both data and power)
3. +12V
4. Gnd
5. TXD (3.3V)
6. RXD (3.3V)
7. Gnd
8. Gnd

It communicates using TTL-232 at 9600 baud. TTL-232 in this context means +3.3V
is 1 and 0V is 0 (not to be confused with [RS-232][] which would be +3.3V is 0
and -3.3V is 1).

License
-------

The Arduino and C code is mostly incomplete and as such is placed in the
[public domain][].

The Python library is a bit more complete and is licensed under the [LGPL v3][LGPL]

[8P8C]: https://en.wikipedia.org/wiki/Modular_connector#8P8C
[RS-232]: https://en.wikipedia.org/wiki/RS-232#Voltage_levels
[tracer-doc]: https://dl.dropboxusercontent.com/s/ftb7lxmp9030u7b/Protocoll-Trcaer-MT-5%EF%BC%88111213%EF%BC%89%281%29.pdf?dl=1&token_hash=AAHvuNfsGRew40X7TqT7XzKpcc6WzkL92hEiv7ej-xv0pA
[public domain]: http://creativecommons.org/publicdomain/zero/1.0/
[LGPL]: https://www.gnu.org/licenses/lgpl.html
