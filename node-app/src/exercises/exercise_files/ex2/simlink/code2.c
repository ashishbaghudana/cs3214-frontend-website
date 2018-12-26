#include "code.h"
#include <math.h>
int invocationcount;
static int temp = -1;

int sum(double *data, int datalen)
{
    invocationcount++;
    int rc = 0;
    for (int i = 0; i < 20; i++) {
        temp = roundtoint(sin(data[i]) * 5 - cos(data[i]) * 10);
        rc += temp;
    }
    return rc;
}
