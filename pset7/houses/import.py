import cs50
import csv
from sys import argv

if len(argv) != 2:
    print('Usage: python import.py [NAME OF CSV FILE]')
    exit(1)

#print('The usage is VALID')
db = cs50.SQL("sqlite:///students.db")
with open(argv[-1], "r") as characters:

    # Create DictReader
    reader = csv.DictReader(characters)

    # Iterate over TSV file
    for row in reader:

        currentName = row['name'].split()
        if len(currentName) == 3:
            first, middle, last = currentName
        else:
            first, last = currentName
            middle = None
        house = row['house']
        birth = row['birth']

        # Insert show
        db.execute("INSERT INTO students (first, middle, last, house, birth) VALUES(?, ?, ?, ?, ?)", first, middle, last, house, birth)

print('You could insert the rows!')