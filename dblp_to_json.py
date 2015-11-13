#!/usr/bin/python3

import sys
import json
import os
import re
import xml.etree.cElementTree as cET

class DBLPEncoder(json.JSONEncoder):
    def default(self, o):
        return o.to_dict()

class Author():
    def __init__(self, name, id):
        self.name = name
        self.id = id

    def to_dict(self):
        return {
            "name": self.name,
            "id": self.id
        }

class Article():
    def __init__(self, id):
        self.title = ""
        self.doi = ""
        self.authors = []
        self.year = -1
        self.id = id

    def to_dict(self):
        return {
            "title": self.title,
            "doi": self.doi,
            "authors": self.authors,
            "year": self.year,
            "id": self.id
        }

class Journal():
    def __init__(self):
        self.title = ""
        self.short_name = ""
        self.num_articles = 0
        self.first_year = 9999
        self.latest_year = 0
        self.authors = []
        self.articles = []

    def __init__(self, title, short_name):
        self.title = title
        self.short_name = short_name
        self.num_articles = 0
        self.first_year = 9999
        self.latest_year = 0
        self.authors = []
        self.articles = []

    # Format the journal information to a dict so we can dump it to JSON
    def to_dict(self):
        return {
            "title": self.title,
            "short_name": self.short_name,
            "num_authors": len(self.authors),
            "num_articles": self.num_articles,
            "first_year": self.first_year,
            "latest_year": self.latest_year,
            "authors": self.authors,
            "articles": self.articles,
        }

# Check that the data and data/authors directories exist. If not, create them
def check_directories():
    if not os.path.isdir("./data/"):
        os.mkdir("./data")
    if not os.path.isdir("./data/authors/"):
        os.mkdir("./data/authors")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: ./dblp_to_json <dblp file> <journal_filters.json>")
        print("\tThe journal filters JSON file specifies the short names of journals that")
        print("\tyou're interested in getting the reduced JSON data for")
        sys.exit(1)

    check_directories()

    desired_journals = {}
    with open(sys.argv[2], "r") as f:
        desired_journals = json.load(f)

    print("Journal Filters: {}".format(desired_journals))
    match_journal_key = re.compile("journals\/(\w+)\/")

    journal = None
    # We want to keep the author information across journals, otherwise we would lose
    # information that one author published in many journals. Instead we would see them as
    # multiple authors, one for each journal they published in.
    authors = {}
    next_author_id = 0
    # We also keep a single article id counter
    next_article_id = 0

    context = iter(cET.iterparse(sys.argv[1], events=("start", "end")))
    event, root = next(context)
    for event, elem in context:
        # For each end tag we hit that is a full article, paper or w/e we want to dump it since we don't
        # need to keep the data around. If it's an article we check if it's in the journal we want and
        # save it to our reduced data set
        if event == "end" and elem.tag == "article" or elem.tag == "inproceedings" \
                or elem.tag == "proceedings" or elem.tag == "book" or elem.tag == "incollection" \
                or elem.tag == "phdthesis" or elem.tag == "mastersthesis" or elem.tag == "www":
            # If it's an article see if it's in our journal filters
            if elem.tag == "article":
                # We also track which journal we're currently parsing so we can dump it once we hit
                # a new journal and avoid keeping all the data around for the entire run
                key = match_journal_key.match(elem.get("key"))
                if key and key.group(1) in desired_journals:
                    # If this is the first journal or we're done reading this journal
                    if journal == None or not key.group(1) == journal.short_name:
                        # If we were previously reading a journal save it out
                        if journal:
                            print("Saving out {}\n\tnum_authors = {}\n\tnum_articles = {}".format(journal.title,
                                len(journal.authors), journal.num_articles))
                            with open("./data/" + journal.short_name + ".json", "w") as fp:
                                json.dump(journal, fp, cls=DBLPEncoder, indent=4)
                        # Setup the new journal we're reading
                        title = ""
                        # Find the journal's full title
                        for child in elem.getiterator("journal"):
                            title = child.text
                        journal = Journal(title, key.group(1))
                    # Add this article to the journal
                    journal.num_articles += 1

                    # Parse the article information
                    article = Article(next_article_id)
                    next_article_id += 1
                    for child in list(elem):
                        if child.tag == "title":
                            article.title = child.text
                        elif child.tag == "author":
                            # This is the first time we've seen this author, so we need to add a new Author entry
                            auth = None
                            if not child.text in authors:
                                auth = Author(child.text, next_author_id)
                                authors[child.text] = auth
                                next_author_id += 1
                            else:
                                auth = authors[child.text]
                            article.authors.append(auth.id)
                            # If this author isn't already recorded for this journal, add their id
                            if not auth.id in journal.authors:
                                journal.authors.append(auth.id)
                        elif child.tag == "year":
                            year = int(child.text)
                            journal.first_year = min(journal.first_year, year)
                            journal.latest_year = max(journal.latest_year, year)
                            article.year = year
                        elif child.tag == "ee":
                            article.doi = child.text

                    journal.articles.append(article)
            # Dump the node we just parsed and any references to it so we don't explode our memory
            root.clear()

    # Save out the last journal we read in, since it won't be dumped by encountering a new one
    if journal:
        print("Saving out {}\n\tnum_authors = {}\n\tnum_articles = {}".format(journal.title,
            len(journal.authors), journal.num_articles))
        with open("./data/" + journal.short_name + ".json", "w") as fp:
            json.dump(journal, fp, cls=DBLPEncoder, indent=4)

    # Save out the author information we've read in
    print("Saving out {} authors".format(len(authors)))
    for _, author in authors.items():
        with open("./data/authors/" + str(author.id) + ".json", "w") as fp:
            json.dump(author, fp, cls=DBLPEncoder, indent=4)


