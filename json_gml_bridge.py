import json
import sys
import re
import networkx as nx


#only_two_author_articles= True

def get_collaboration_graph(json_filename):
  authors= {}
  edges= {}
  
  json_object= json.loads(open(json_filename, "r").read())

  for author in json_object["authors"]:
    authors[author]= 0

  for article in json_object["articles"]:
    #if len(article["authors"])< 2 or (only_two_author_articles and len(article["authors"])> 4):
    #  continue
    
    
    
    for author in article["authors"]:
      if author not in authors:
        continue
      
      authors[author]+= 1
      
      for collaborator in article["authors"]:
        if collaborator not in authors:
          continue
        if author is collaborator:
          continue
        
        pair= None
        if author < collaborator:
          pair= (author, collaborator)
        else:
          pair= (collaborator, author)
        
        if pair not in edges:
          edges[pair]= 0
        edges[pair]+= 1

  connected_authors= set()
  for author in authors:
    if authors[author]> 0:
      connected_authors.add(author)

  return connected_authors, edges

def get_authors_from_gml(gml_filename):
  gml_object= json.loads(open(gml_filename, "r").read())
  
  print gml_object


#Usage:

#To turn a json data into gml file,
#json_gml_bridge.py journal.json output.gml

#To update json data from edited gml,
#json_gml_bridge.py original_journal.json modified_gml.gml output_journal.json

if len(sys.argv)== 3:
  
  json_filename= sys.argv[1]
  gml_filename= sys.argv[2]
    
  authors, edges= get_collaboration_graph(json_filename)
  
  gml_file= open(gml_filename, "w")
  gml_file.write("graph \n[\ndirected 0\n")
  
  for author in authors:
    gml_file.write("node [\nid "+ str(author)+ "\nlabel \n\""+ str(author)+ "\"\n]\n")
    
  for edge in edges:
    gml_file.write("edge [\nsource "+ str(edge[0])+ "\ntarget "+ str(edge[1])+ "\nvalue "+ str(edges[edge])+ "\n]\n")
    
  gml_file.write("]")
    
elif len(sys.argv)== 4:
  
  input_json_filename= sys.argv[1]
  gml_filename= sys.argv[2]
  output_json_filename= sys.argv[3]

  json_object= json.loads(open(input_json_filename, "r").read())
  
  gml_string= open(gml_filename, "r").read()
  gml_string= gml_string.replace("graph\n", "graph \n")
  gml_string= gml_string.replace("node\n", "node \n")
  gml_string= gml_string.replace("edge\n", "edge \n")
  gml_string= re.sub("Creator Gephi\n", "", gml_string)
  gml_string= gml_string.replace("graphics\n", "graphics \n")
  
  open(gml_filename, "w").write(gml_string)
  gml_object= nx.parse_gml(gml_string)
  
  json_object["authors"]= map(int, gml_object.nodes())
  open(output_json_filename, "w").write(json.dumps(json_object, indent= 4))

  
  
    
    
        
    
      
    
  
    
    
    
    
      
      
      
      
      
      
      
      
      