#!/usr/bin/python

# import xml.sax
from xml.dom.minidom import parse
import xml.dom.minidom
import sys
import hashlib
import json
import os
import re

# try:
#       from bs4 import BeautifulSoup
#     except ImportError:
#       try:
#         from BeautifulSoup import BeautifulSoup
#       except ImportError:
#         print "BeautifulSoup not present."
#         sys.exit()

nodes = {}
edges = []
node_count = 0;
edge_count = 0;

NODEFILE = "nodes.json"
EDGEFILE = "edges.json"
GML = "data.gml"

def hashString(data):
    data = data.encode('ascii',errors='ignore')
    data = str(data)
    return hashlib.md5(data).hexdigest()

def saveNodes2Json():
    with open(NODEFILE, 'w') as f:
        json.dump(nodes, f)
    return True;

def saveEdges2Json():
    with open(EDGEFILE, 'w') as f:
        json.dump(edges, f)
    return True;

def save2GML(make_collaboration_graph= False):
    f = open(GML, 'w')
    f.write("graph" + '\n')
    f.write("[" + '\n')
    for n in nodes:
        n = nodes[n]
        if make_collaboration_graph and n.type!= 1:
            continue
        
        
        f.write('  node' + '\n')
        f.write('  [' + '\n')
        if n.type == 1:
            f.write('    id '+n.id + '\n')
            f.write('    type '+str(n.type) + '\n')
            f.write('    name \"'+str(n.name) + '\"\n')
        elif n.type == 2:
            f.write('    id '+n.id + '\n')
            f.write('    type '+str(n.type) + '\n')
            f.write('    title \"'+str(n.title.encode('ascii',errors='ignore')).replace("\"", "\'") + '\"\n')
            f.write('    year '+str(n.year) + '\n')
        elif n.type == 3:
            f.write('    id '+n.id + '\n')
            f.write('    type '+str(n.type) + '\n')
            f.write('    title \"'+str(n.title.encode('ascii',errors='ignore')).replace("\"", "\'") + '\"\n')
        f.write('  ]' + '\n')
    for e in edges:
        if make_collaboration_graph:
            if nodes[e[0]].type!= 1 or nodes[e[1]].type!= 1:
                continue
        else:
            if nodes[e[0]].type== 1 and nodes[e[1]].type== 1:
                continue
        
        f.write('  edge' + '\n')
        f.write('  [' + '\n')
        f.write('    source ' + str(e[0]) + '\n')
        f.write('    target ' +str(e[1]) + '\n')
        f.write('  ]' + '\n')
    f.write("]")
    f.close()
# def saveNodes2GML():
#     with open(NODEFILE, 'w') as f:
#         json.dump(nodes, f)
#     return True;

# def saveEdges2GML():
#     with open(EDGEFILE, 'w') as f:
#         json.dump(edges, f)
#     return True;

class Author():
    def __init__(self):
        self.type = 1
        self.id = ""
        self.name = ""

    def __init__(self, name):
        self.type = 1
        self.id = hashString(name)
        self.name = name

    def setName(self,name):
        self.name = name;
        self.id = hashString(name)

class Article():
    def __init__(self):
        self.type = 2
        self.id = ""
        self.title = ""
        self.year = ""
        self.url = ""
        
    def __init__(self, title, year, url):
        self.type = 2
        self.id = hashString(title)
        self.title = title
        self.year = year
        self.url = url

    def setTitle(self,title):
        self.title = hashString(title);

    def setYear(self,year):
        self.year = year;

    def setURL(self,url):
        self.url = url;

class Journal():
    def __init__(self):
        self.type = 3
        self.id = ""
        self.title = ""
        
    def __init__(self, title):
        self.type = 3
        self.id = hashString(title)
        self.title = title

    def setTitle(self,title):
        self.title = title;
        self.id = hashString(title);


class JournalXML2GML():
    def __init__(self):
        self.field = ""
        self.title = ""
        self.authors = []
        self.year = ""
        self.journal = ""
        self.url = ""
        self.mdate = ""
        self.key = ""

    # Call when an element starts
    def startElement(self, tag, attributes):
        self.field = tag
        if tag == "article":
            self.mdate = attributes["mdate"]
            self.key   = attributes["key"]

    def characters(self, content):
        if self.field == "author":
            self.authors.append(content)
        elif self.field == "title":
            self.title = content
        elif self.field == "ee":
            self.url = content
        elif self.field == "journal":
            self.journal = content
        elif self.field == "year":
            self.year = content

    def endElement(self, tag):
        if tag == "article":
            hashkey_title = hashString(self.title);
            hashkey_journal = hashString(self.journal);
            edges.append([hashkey_title, hashkey_journal])
            hashkey_authors = [];
            for author in self.authors:
                authorkey = hashString(author)
                hashkey_authors.append(authorkey)
                if authorkey not in nodes:
                    nodes[authorkey] = Author(author)
                edges.append([authorkey, hashkey_journal])
                edges.append([authorkey, hashkey_title])
                
                for collaborator in self.authors:
                    if collaborator is author:
                        continue
                
                    collaboratorkey= hashString(collaborator)
                    edges.append([authorkey, collaboratorkey])
                  
                
            if hashkey_title not in nodes:
                nodes[hashkey_title] = Article(self.title, self.year, self.url)
            if hashkey_journal not in nodes:
                nodes[hashkey_journal] = Journal(self.journal)
            clear()
            
    def clear(self):
        self.field = ""
        self.title = ""
        self.authors = []
        self.year = ""
        self.journal = ""
        self.url = ""
        self.mdate = ""
        self.key = ""

def XMLParser(filename):
    DOMTree = xml.dom.minidom.parse(filename)
    collection = DOMTree.documentElement
    articles = collection.getElementsByTagName("article")
    for article in articles:
        data = JournalXML2GML()
        if article.getElementsByTagName('title').length > 0:
            data.title = article.getElementsByTagName('title')[0].childNodes[0].data
        if article.getElementsByTagName('author').length > 0:
            for i in range(1, article.getElementsByTagName('author').length):
                data.authors.append(article.getElementsByTagName('author')[i].childNodes[0].data)
        if article.getElementsByTagName('year').length > 0:
            data.year = article.getElementsByTagName('year')[0].childNodes[0].data
        if article.getElementsByTagName('journal').length > 0:
            data.journal = article.getElementsByTagName('journal')[0].childNodes[0].data
        if article.getElementsByTagName('ee').length > 0:
            data.url = article.getElementsByTagName('ee')[0].childNodes[0].data
        data.mdate = article.getAttribute('mdate')
        data.key = article.getAttribute('key')
        hashkey_title = hashString(data.title);
        hashkey_journal = hashString(data.journal);
        edges.append([hashkey_title, hashkey_journal])
        hashkey_authors = [];
        for author in data.authors:
            authorkey = hashString(author)
            hashkey_authors.append(authorkey)
            if authorkey not in nodes:
                nodes[authorkey] = Author(author)
            edges.append([authorkey, hashkey_journal])
            edges.append([authorkey, hashkey_title])
            
            for collaborator in data.authors:
                if collaborator is author:
                    continue
            
                collaboratorkey= hashString(collaborator)
                edges.append([authorkey, collaboratorkey])
            
        if hashkey_title not in nodes:
            nodes[hashkey_title] = Article(data.title, data.year, data.url)
        if hashkey_journal not in nodes:
            nodes[hashkey_journal] = Journal(data.journal)

def cleanupTxtFile(filename):
    # Read in the file
    filedata = None
    with open(filename, 'r') as file :
      filedata = file.read()

    # Replace the target string
    filedata = filedata.replace('<i>', '').replace('</i>', '') #.replace('&#8482;','')

    # Write the file out again
    with open(filename, 'w') as file:
      file.write(filedata)

if __name__ == "__main__":
    print "XML to GML "
    readfile = sys.argv[1]
    
    #we may consider adding a formal option functionality in the future
    make_collaboration_graph= False
    if(len(sys.argv) > 2 and sys.argv[2]== "-collaboration"):
        make_collaboration_graph= True
      
    if os.path.exists(readfile) is False:
        print "File doesn't exist."
    cleanupTxtFile(readfile)
    # xml2gml(readfile, savefile)
    # create an XMLReader
    # parser = xml.sax.make_parser()
    # # turn off namepsaces
    # parser.setFeature(xml.sax.handler.feature_namespaces, 0)
    # # override the default ContextHandler
    # Handler = JournalXML2GML()
    # parser.setContentHandler( Handler )
    # #execute
    # parser.parse("./dblp_small.xml")
    XMLParser(readfile)
    # saveNodes2Json()
    # saveEdges2Json()
    print "done"
    save2GML(make_collaboration_graph)
