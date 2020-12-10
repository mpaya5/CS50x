#include <cs50.h>
#include <stdio.h>

int main(void)
{
    int height;
    do
    {
        height = get_int("Height: "); //Define the height
    }
    while(height < 1 || height > 8); //Excluding 9

    if(height > 0 || height < 9)
    {
        int i = 0; // i is working as a counter

        for(int lines = 0; lines < height; lines++)
        {
            if(i != height)
            {
                for(int spaces = (height-1) - i; spaces > 0; spaces--) // Creating the space
                {
                    printf(" ");
                }

                for(int hashes = 0; hashes <= i; hashes++) //Hashes or hastags in left direction
                {
                    printf("#");
                }

                printf("  "); //Space between columns

                for(int hashes = 0; hashes <= i; hashes++) //Hashes or hastags in right direction
                {
                    printf("#");
                }

                printf("\n");
                i++;
            }
        }
    }

}