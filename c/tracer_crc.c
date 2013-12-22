#include <stdio.h>

// A direct copy of the CRC function in the documentation found

unsigned short crc(unsigned char *CRC_Buff, unsigned char crc_len) {
	unsigned char crc_i, crc_j, r1, r2, r3, r4;
	unsigned short crc_result;

	r1 =*CRC_Buff;
	CRC_Buff++;

	r2=*CRC_Buff;
	CRC_Buff++;

	for (crc_i = 0; crc_i < crc_len -2; crc_i++) {
		r3 =* CRC_Buff;
		CRC_Buff++;

		for (crc_j=0; crc_j < 8; crc_j++) {
			r4 = r1;
			r1 = (r1<<1);

			if ((r2 & 0x80) != 0) {
				r1++;
			}

			r2 = r2<<1;

			if((r3 & 0x80) != 0) {
				r2++;
			}

			r3 = r3<<1;

			if ((r4 & 0x80) != 0) {
				r1 = r1^0x10;
				r2 = r2^0x41;
			}
		}
	}

	crc_result = r1;
	crc_result = crc_result << 8 | r2;

	return(crc_result);
}

int main(void){
	unsigned char data[] = {0x16, 0xA0, 0x00, /* CRC */ 0x00, /* CRC */ 0x00, 0x7F};
	unsigned short crc_d = crc(data, data[2] + 5);
	data[data[2] + 3] = crc_d >> 8;
	data[data[2] + 4] = crc_d & 0xFF;

	for (int i = 0; i < sizeof(data); i++){
		printf("%02x ", data[i]);
	}
	printf("\n");

}
