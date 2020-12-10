#include <cs50.h>
#include <stdio.h>

int main(void)
{
    string name = get_string("What's your name?\n");
    printf("Hello, %s\n", name); //El %s es para llamar a un string
}