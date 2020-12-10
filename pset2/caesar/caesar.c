#include <cs50.h>
#include <stdio.h>
#include <math.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

bool is_valid_key(string s);
void encrypt(string plaintext, string ciphertext, int k);

int main(int argc, string argv[])
{
    //argv[0] => name of the program
    //argv[1] => key
    if(argc != 2 || !is_valid_key(argv[1]))
    {
        printf("Usage: ./caesar key\n");
        return 1;
    }

    //It should be valid now
    int k = atoi(argv[1]);
    string s = get_string("plaintext: ");
    int n = strlen(s);
    char ciphertext[n + 1];
    encrypt(s, ciphertext, k);
    printf("ciphertext: %s\n", ciphertext);
    return 0;
}

void encrypt(string plaintext, string ciphertext, int k)
{
    int i = 0;

    for(i = 0; i < strlen(plaintext); i++)
    {
        char ch = plaintext[i]; // A

        if (isalpha(ch))
        {
            //Encrypt
            //ci = (pi + k) % 26
            //pi = current character as int (a -> o, b -> 1...)
            char temp = tolower(ch);
            int pi = temp - 'a';
            char ci = ((pi + k) % 26) + 'a'; // 0
            ciphertext[i] = islower(ch) ? ci : toupper(ci);

        }else
        {
            ciphertext[i] = ch;
        }
    }
    //We have our ciphertext
    ciphertext[i] = '\0';
}

bool is_valid_key(string s)
{
    //13, 25, 13x
    for(int i =0; i < strlen(s); i++)
    {
        char ch = s[i];
        if (!isdigit(ch))
        {
            return false;
        }
    }

    return true;
}