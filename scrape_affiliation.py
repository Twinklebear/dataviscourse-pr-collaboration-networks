import requests
from lxml import html, etree

def scrape_acm(doi):
    page = requests.get(doi)
    print(page.url)
    tree = html.fromstring(page.content)
    author_affiliations = {}
    authors = tree.xpath('//td/a[@title="Author Profile Page"]')
    for a in authors:
        print("author = {}".format(a.text))
        affiliation = a.getparent().getnext().find("a/small").text
        print("affiliation = {}".format(affiliation))
        author_affiliations[a.text] = affiliation
    return author_affiliations


def scrape_affiliation(doi):
    if doi.startswith("http://doi.acm.org/"):
        return scrape_acm(doi)
    print("Error! Unhandled DOI url {}".format(doi))
    return None

