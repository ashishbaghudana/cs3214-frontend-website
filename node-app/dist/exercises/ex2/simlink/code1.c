#include "code.h"
#include <stdio.h>
static double data[20];
static int temp = -2;

int
main()
{
    for (int i = 0; i < 20; i++)
        data[i] = i;
    temp = sum(data, 20);
    printf("sum = %d\n", temp);
    printf("inv = %d\n", invocationcount);
}
