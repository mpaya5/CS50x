import cs50
import csv
from sys import argv

if len(argv) != 2:
    print('Usage: python roster.py [NAME OF THE HOUSE]')
    exit(1)

db = cs50.SQL("sqlite:///students.db")
rows = db.execute('SELECT * FROM students WHERE house = ? ORDER BY last, first', argv[-1])

for row in rows:
    # first middle last birth (WITHOUT COMAS)
    # Miguel Payá Abadía 1998
    # Miguel Payá 1998
    print(row['first'] + ' ' + (row['middle'] + ' ' if row['middle'] != None else '') + row['last'] + ',born ' + str(row['birth']))