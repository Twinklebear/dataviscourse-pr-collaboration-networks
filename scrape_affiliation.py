import requests
from lxml import html, etree

def scrape_acm(page):
    tree = html.fromstring(page.content)
    author_affiliations = []
    authors = tree.xpath('//td/a[@title="Author Profile Page"]')
    for a in authors:
        affiliation = a.getparent().getnext().find("a/small")
        # If we don't find it under a URL it's likely just a <small>
        if affiliation == None:
            affiliation = a.getparent().getnext().find("small")
        if affiliation:
            affiliation = affiliation.text
        else:
            affiliation = "None"
        author_affiliations.append(affiliation)
    return author_affiliations

# Returns an array of the author affilations, ordered by the author appearance list on the paper
# e.g. first author, second author, etc. This is done because we can't assume the names in the DBLP
# database exactly match the names shown on the webpage.
def scrape_affiliation(doi):
    # The doi urls are typically just http://dx.doi.org/... and we get the actual publication host
    # by following the redirect, so we must hit the page before we know if we can handle the URL
    # or not.
    page = requests.get(doi)
    if page.url.startswith("http://dl.acm.org/"):
        return scrape_acm(page)
    print("Error! Unhandled Journal Site {}".format(page.url))
    return None

