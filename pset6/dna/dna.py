from sys import argv
from cs50 import get_string

if len(argv) != 3:
    print('This is an error')
    exit(1)

csv_file = open(argv[1], 'r')

strands = []
persons = {}
for ind, row in enumerate(csv_file):
    if ind == 0:
        strands= [strand for strand in row.strip().split(',')][1:]
    else:
        curr_row = row.strip().split(',')
        persons[curr_row[0]] = [int(x) for x in curr_row[1:]]

dna_strand = open(argv[2], 'r').read()

final_strands = []
for strand in strands:
    i = 0
    max_strand = -1
    cur_max = 0

    while i < len(dna_strand):
        cur_window = dna_strand[i:i+len(strand)]
        if cur_window == strand:
            cur_max += 1
            max_strand = max(max_strand, cur_max)
            i += len(strand)
        else:
            cur_max = 0
            i += 1

    final_strands.append(max_strand)

for name,data in persons.items():
    if data == final_strands:
        print(name)
        exit(0)

print('No match')
