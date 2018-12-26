#include <stdio.h>
#include <malloc.h>

int data = 42;
int bss;

int
main()
{
    int stack;
    printf("my heap  is at %p\n", malloc(4));
    printf("my stack is at %p\n", &stack);
    printf("my text  is at %p\n", main);
    printf("my data  is at %p\n", &data);
    printf("my bss   is at %p\n", &bss);
}
