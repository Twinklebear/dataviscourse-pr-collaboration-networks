#!/usr/bin/python3

import requests
from lxml import html, etree

page = requests.get("http://doi.acm.org/10.1145/2070781.2024171")
tree = html.fromstring(page.content)
authors = tree.xpath('//td/a[@title="Author Profile Page"]')
for a in authors:
    print("author = {}".format(a.text))
    affiliation = a.getparent().getnext().find("a/small").text
    print("affiliation = {}".format(affiliation))

