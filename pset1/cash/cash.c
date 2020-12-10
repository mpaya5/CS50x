#include <cs50.h>
#include <stdio.h>
#include <math.h>

int main()
{
    float dollars;
    do
    {
        dollars = get_float("Change owed: ");
    }
    while(dollars < 0);
    int cents = round(dollars * 100);

    int coins = 0;

    while(cents != 0)
    {
        //25
        coins += cents / 25;
        cents = cents % 25;

        //10 counts
        coins += cents / 10;
        cents %= 10;

        //5 counts
        coins += cents / 5;
        cents %= 5;

        //1
        coins += cents / 1;
        cents %= 1;
    }



    printf("%d\n", coins);
}