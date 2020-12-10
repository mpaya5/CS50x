from cs50 import get_string

text = get_string("Text: ")

letters = symbols = words = 0

for char in text:
    if char.isalpha():
        letters += 1
    if char.isspace():
        words += 1
    if char in ['?', '.', '!']:
        symbols += 1

words += 1
L = (letters * 100.0) / words
S= (symbols * 100.0) / words
result = int((0.0588 * L - 0.296 * S - 15.8) + 0.5)

if result < 1:
    print("Before Grade 1")
elif result >= 16:
    print("Grade 16+")
else:
    print(f"Grade {result}")