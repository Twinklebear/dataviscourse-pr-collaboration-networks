#!/usr/bin/python3

import sys
import json

if len(sys.argv) < 4:
    print("Usage: ./remap_authors.py <input_journal> <old_authors.json> <new_authors.json>")
    print("The input journal will have its author id's updated to the ids of the same authors in <new_authors.json>")
    sys.exit(1)

# Build a map of author name to the new id
author_ids = {}
with open(sys.argv[3], "r") as f:
    authors = json.load(f)
    for i, a in enumerate(authors):
        if a["name"] not in author_ids:
            author_ids[a["name"]] = i

journal = {}
with open(sys.argv[1], "r") as jf, open(sys.argv[2], "r") as old_auth:
    old_authors = json.load(old_auth)
    journal = json.load(jf)
    # Go through and update each author in the journal
    for i, a in enumerate(journal["authors"]):
        name = old_authors[a]["name"]
        new_id = author_ids[name]
        print("Remapping {} from id {} to new id {}".format(name, a, new_id))
        journal["authors"][i] = new_id

    # Go through and update each article as well
    for article in journal["articles"]:
        for i, a in enumerate(article["authors"]):
            name = old_authors[a]["name"]
            new_id = author_ids[name]
            print("Remapping journal author {} from id {} to new id {}".format(name, a, new_id))
            article["authors"][i] = new_id

with open(sys.argv[1], "w") as fp:
    json.dump(journal, fp, indent=4)

