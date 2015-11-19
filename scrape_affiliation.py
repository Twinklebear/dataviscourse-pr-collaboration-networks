import requests
import re
from lxml import html, etree

def scrape_acm(page):
    tree = html.fromstring(page.content)
    author_affiliations = []
    # The ACM author affiliations are stored in a kind of nasty table layout,
    # best to view source or inspect element on their page for an explanation of this.
    authors = tree.xpath('//td/a[@title="Author Profile Page"]')
    for a in authors:
        affiliation = a.getparent().getnext().find("a/small")
        # If we don't find it under a URL it's likely just a <small>
        if affiliation == None:
            affiliation = a.getparent().getnext().find("small")
        if affiliation != None:
            affiliation = affiliation.text
        else:
            affiliation = "None"
        author_affiliations.append(affiliation)
    return author_affiliations

# IEEE Actually has an API! So we use that to get author affilation information from them
def scrape_ieee(doi_url):
    match_doi = re.compile("http:\/\/.*doi[^\/]*\/(.+)")
    doi = match_doi.match(doi_url)
    if doi:
        doi = doi.group(1)
        page = requests.get("http://ieeexplore.ieee.org/gateway/ipsSearch.jsp?doi=" + doi)
        tree = etree.fromstring(page.content)
        authors = tree.xpath("//authors/text()")
        affiliations = tree.xpath("//affiliations/text()")
        return affiliations

# Returns an array of the author affilations, ordered by the author appearance list on the paper
# e.g. first author, second author, etc. This is done because we can't assume the names in the DBLP
# database exactly match the names shown on the webpage.
def scrape_affiliation(doi):
    if doi:
        # The doi urls are typically just http://dx.doi.org/... and we get the actual publication host
        # by following the redirect, so we must hit the page before we know if we can handle the URL
        # or not.
        try:
            page = requests.get(doi)
            if page.url.startswith("http://dl.acm.org/"):
                return scrape_acm(page)
            elif page.url.startswith("http://www.computer.org/") \
                    or page.url.startswith("http://ieeexplore.ieee.org/"):
                return scrape_ieee(doi)
            print("Warning! Unhandled Journal Site {}".format(page.url))
        except:
            print("Warning! Exception encountered when processing {}".format(page.url))
    else:
        print("Warning! Empty DOI URL")
    return None

