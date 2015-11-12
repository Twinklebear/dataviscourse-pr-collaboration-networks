#!/usr/bin/python

# import xml.sax
from xml.dom.minidom import parse
import xml.dom.minidom
import sys
import hashlib
import json
import os
import re
import getopt

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

def edgeTest(edge, make_collaboration_graph, journal_nicks):
    node_a_hash= edge[0][0]
    node_b_hash= edge[0][1]
    article_data= edge[1]
    
    if make_collaboration_graph:
        if nodes[node_a_hash].type!= 1 or nodes[node_b_hash].type!= 1:
            return False
    else:
        if nodes[node_a_hash].type== 1 and nodes[node_b_hash].type== 1:
            return False
          
    if article_data.journalnick not in journal_nicks:
      return False
    
    return True

def save2GML(make_collaboration_graph= False, journal_nicks= None):
    print "exporting file..."
  
    f = open(GML, 'w')
    f.write("graph" + '\n')
    f.write("[" + '\n')
    
    connected_node_hashes= set()
    for e in edges:
        if not edgeTest(e, make_collaboration_graph, journal_nicks):
            continue
        connected_node_hashes.add(e[0][0])
        connected_node_hashes.add(e[0][1])
    
    for node_hash in nodes:
        n = nodes[node_hash]
        if node_hash not in connected_node_hashes:
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
        if not edgeTest(e, make_collaboration_graph, journal_nicks):
            continue
      
        node_a_hash= e[0][0]
        node_b_hash= e[0][1]
        
        f.write('  edge' + '\n')
        f.write('  [' + '\n')
        f.write('    source ' + str(node_a_hash) + '\n')
        f.write('    target ' +str(node_b_hash) + '\n')
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
        self.journalnick= ""
        
    def __init__(self, title, journalnick):
        self.type = 3
        self.id = hashString(title)
        self.title = title
        self.journalnick= journalnick

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
    def startElement(self, nick, attributes):
        self.field = nick
        if nick == "article":
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

    def endElement(self, nick):
        if nick == "article":
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

def XMLParser(file_string):
    print "parsing file..."
  
    print "converting to dom tree..."
    DOMTree = xml.dom.minidom.parseString(file_string)
    print "finished converting."
    
    print "getting articles..."
    collection = DOMTree.documentElement
    articles = collection.getElementsByTagName("article")
    print "finished getting articles."
    
    articles_processed= 0
    for article in articles:
        articles_processed+= 1
        if (articles_processed% 100)== 0:
          print articles_processed, "articles processed,", str(articles_processed/ float(len(articles))), "%"
      
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
        
        journal_nick_match= re.match("journals/([^/]*)/.*", data.key)
        data.journalnick= journal_nick_match.group(1) if journal_nick_match is not None else None
        
        hashkey_title = hashString(data.title);
        hashkey_journal = hashString(data.journal);
        edges.append(((hashkey_title, hashkey_journal), data))
        hashkey_authors = [];
        for author in data.authors:
            authorkey = hashString(author)
            hashkey_authors.append(authorkey)
            if authorkey not in nodes:
                nodes[authorkey] = Author(author)
            edges.append(((authorkey, hashkey_journal), data))
            edges.append(((authorkey, hashkey_title), data))
            
            for collaborator in data.authors:
                if collaborator is author:
                    continue
            
                collaboratorkey= hashString(collaborator)
                edges.append(((authorkey, collaboratorkey), data))
            
        if hashkey_title not in nodes:
            nodes[hashkey_title] = Article(data.title, data.year, data.url)
        if hashkey_journal not in nodes:
            nodes[hashkey_journal] = Journal(data.journal, data.journalnick)
            
    print "finished parsing file."

def cleanupTxtFile(filename):
    print "cleaning file..."
  
    # Read in the file
    filedata = None
    with open(filename, 'r') as file :
        filedata = file.read()

    # Replace the target string
    filedata = filedata.replace('<i>', '').replace('</i>', '') #.replace('&#8482;','')

    # Write the file out again
    with open(filename, 'w') as file:
        file.write(filedata)
      
    print "finished cleaning file."
    
    return filedata

#this is gonna be messy
def filterFileString(filename, file_string, journal_nicks):
    file_string = open(filename, "r")
    filtered_file_string= ("<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n"
                           "<!DOCTYPE dblp SYSTEM \"dblp.dtd\">\n"
                           "<dblp>\n")
    
    if journal_nicks is None:
        return file_string
      
    print "filtering file..."
    
    in_article= False
    in_filtered_article= False
    
    lines_processed= 0
    for line in file_string:
        lines_processed+= 1
        if (lines_processed% 100000)== 0:
            print lines_processed, "lines processed."
        if line== "\n":
            continue
            
        just_exited_article= False
        just_exited_filtered_article= False
        
      
        if in_article:
            match= re.search("</article>", line)
            
            if match is not None:
                in_article= False
                just_exited_article= True
                
                if in_filtered_article:
                    in_filtered_article= False
                    just_exited_filtered_article= True
                
        if not in_article:
            match= re.search("<article.*>", line)
            
            if match is not None:
                in_article= True
                
                if just_exited_article:
                    match= re.search("</article>", line)
                    line= line.replace(match.group(), "")
                    
                    if not just_exited_filtered_article:
                        filtered_file_string+= "</article>\n"
                    
                just_exited_article= False
                just_exited_filtered_article= False
                  
                match= re.search("key=\"journals/([^/]*)/.*\"", line)
                if match is None:
                    in_filtered_article= True
                elif match.group(1) not in journal_nicks:
                    in_filtered_article= True
                    
        if (in_article or just_exited_article) and (not in_filtered_article and not just_exited_filtered_article):
            filtered_file_string+= line
            
    filtered_file_string+= "</dblp>\n"
            
            
    print "finished filtering file."
            
    print "saving filtered file..."
    filtered_file= open("filtered_xml.xml", "w")
    filtered_file.write(filtered_file_string)
    print "finished saving filtered file"
    
    return filtered_file_string

if __name__ == "__main__":
    print "XML to GML "
    
    options= None
    arguments= None
    try:
        options, arguments= getopt.getopt(sys.argv[1:], "cf", ["collaboration", "journal-nicks="])
    except getopt.GetoptError as error:
        print "options entered are invalid"
        sys.exit()
    if len(arguments)== 0:
        print "didn't specify xml file"
        sys.exit()
        
    readfile = arguments[0]
    if os.path.exists(readfile) is False:
        print "File doesn't exist."
        
    make_collaboration_graph= False
    journal_nicks= None
    dont_filter_file= True
    
    for option, argument in options:
        if option== "--collaboration":
            make_collaboration_graph= True
        elif option== "--journal-nicks":
            journal_nicks= argument.split(",")
        elif option== "-c":
            cleanupTxtFile(readfile)
        elif option== "-f":
            dont_filter_file= False
            
    file_string= None
    if dont_filter_file:
        file_string= open(readfile, "r").read()
    else:
        file_string= filterFileString(readfile, file_string, journal_nicks)
          
            
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
    XMLParser(file_string)
    # saveNodes2Json()
    # saveEdges2Json()
    print "done"
    save2GML(make_collaboration_graph, journal_nicks)
