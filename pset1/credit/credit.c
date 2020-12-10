#include <cs50.h>
#include <stdio.h>

int main()
{
    long credit;
    int total_sum = 0, pos = 0, total_length = 0;

    do
    {
        credit = get_long("Number: ");

        while (credit != 0)
        {
            if (pos %2 != 0)
            {//Every other digit
                int temp = 2 * (credit % 10);

                if (temp > 9)
                {
                    total_sum += (temp % 10 + temp / 10); // 12 => 1+2
                }else
                {
                    total_sum += temp;
                }

            }else
            {
                total_sum += credit % 10;
            }

            credit = credit / 10;
            pos++;
            total_length++;
        }
    }

    while(credit != 0);

    if (total_sum % 10 == 0)
    {

    }else
    {
        printf("Invalid!\n");
    }
}