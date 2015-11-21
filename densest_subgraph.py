#thoughts, TODO
#do we need facilities to correct errors in incoming networks?
#how to deal with possibiity of densest subgraph being unconnected?

#highest density subgraphs that aren't larger than the previous and next subgraphs are suspect

import json
import sys


class Node:
  def __init__(self, name):
    self.neighbors= {}#rename this neighbors
    self.name= name
    
  def __eq__(self, other):
        return self.name== other.name

  def __ne__(self, other):
    return not self.__eq__(other)
      
  def __hash__(self):
    return hash(self.name)

  def __str__(self):
    return str(self.name)
    
    
  def create_copy(self, copied_node_set):
    for node in copied_node_set:
      if node== self:
        return node
    
    copied_self= Node(self.name)
    copied_node_set.add(copied_self)
    
    for neighbor in self.neighbors:
      found= False
      for node in copied_node_set:
        if node== neighbor:
          copied_self.neighbors[node]= self.neighbors[neighbor]
          found= True
          break
      
      if not found:
        copied_self.neighbors[neighbor.create_copy(copied_node_set)]= self.neighbors[neighbor]
        
    return copied_self
  
  @staticmethod
  def copy_node_set(node_set):
    copied_node_set= set()
    
    for node in node_set:
      copied_node_set.add(node.create_copy(copied_node_set))
      
    return copied_node_set

def find_densest_subgraph(nodes):
  original_nodes= nodes
  nodes= Node.copy_node_set(original_nodes)
  #for node in nodes
  
  subgraph_densities= []
  removed_nodes= []

  max_degree= 0
  subgraph_nodes= {}
  for node in nodes:
    degree= len(node.neighbors)
    
    if degree not in subgraph_nodes:
      subgraph_nodes[degree]= set()
      if degree> max_degree:
        max_degree= degree
      
    subgraph_nodes[degree].add(node)
    
  #for degree in subgraph_nodes:
  #  subgraph_nodes[degree]= sorted(subgraph_nodes, key=id)
    
  for i in range(len(nodes)):
    
    density= 0
    total_node_count= 0
    for degree in subgraph_nodes:#shouldn't be a problem if # of # of neighbors is not strongly proportional to n
      node_count= len(subgraph_nodes[degree])
      
      density+= degree* node_count
      total_node_count+= node_count
      
    if total_node_count> 0:
      density= density/ float(total_node_count)
    
    subgraph_densities.append(density)
    #once density starts going down, should be able to early terminate
    
    if total_node_count== 0:
      break

    removed_node= None
    for degree in subgraph_nodes:
      if degree not in subgraph_nodes:
        continue
      if len(subgraph_nodes[degree])== 0:
        continue
      
      removed_node= None
      if False:
        removed_node= subgraph_nodes[degree].popitem()[0]     
      else:#I believe this is linear, so may not work for large datasets
        plebbiest_node= None
        lowest_inverse_plebisity= 0
        for node in subgraph_nodes[degree]:
          inverse_plebisity= 0
          
          for neighbor in node.neighbors:
            inverse_plebisity+= len(neighbor.neighbors)
            
          if plebbiest_node is None or lowest_inverse_plebisity> inverse_plebisity:
            plebbiest_node= node
            lowest_inverse_plebisity= inverse_plebisity
          
        subgraph_nodes[degree].remove(plebbiest_node)
        removed_node= plebbiest_node
      
      break
    
    for i in range(len(removed_node.neighbors)):
      neighbor= removed_node.neighbors.popitem()[0]
      degree= len(neighbor.neighbors)

      del neighbor.neighbors[removed_node]#possible linear operation
      
      subgraph_nodes[degree].remove(neighbor)
      
      if (degree- 1) not in subgraph_nodes:
        subgraph_nodes[degree- 1]= set()
      subgraph_nodes[degree- 1].add(neighbor)
    name_list= []
    removed_nodes.append(removed_node)
    

  highest_density_index= 0
  for i in range(len(subgraph_densities)):
    print "density at step", i, ":", subgraph_densities[i], "(removed", "nothing" if i== 0 else str(removed_nodes[i- 1].name), ")"
    if subgraph_densities[i]> subgraph_densities[highest_density_index]:
      highest_density_index= i
  print "highest density:", subgraph_densities[highest_density_index], "index:", highest_density_index

  removed_node_set= set()
  for i in range(highest_density_index):
    removed_node_set.add(removed_nodes[i])
  
  fresh_nodes= Node.copy_node_set(original_nodes)
  densest_subgraph_nodes= set()
  for node in fresh_nodes:
    if node in removed_node_set:
      continue
    
    for neighbor in node.neighbors.keys():#possible linear operation
      if neighbor in removed_node_set:
        del node.neighbors[neighbor]#possible linear operation
    
    densest_subgraph_nodes.add(node)
  
  return densest_subgraph_nodes, subgraph_densities[highest_density_index]

def find_k_densest_subgraphs(nodes, k):
  data= {}
  data["clusters"]= {}
  
  for i in range(k):
    print "\n\nSubgraph", i
    densest_subgraph_nodes, density= find_densest_subgraph(nodes)

    name_list= []
    print "densest subgraph:"
    for node in densest_subgraph_nodes:
      print node.name, ":",
      for neighbor in node.neighbors:
        print neighbor.name, ",",
      
      print ""
      
      name_list.append(node.name)
    data["clusters"]["Cluster"+ str(i)]= {"authors": name_list, "density": density}

    for node in densest_subgraph_nodes:
      print "removing", node.name
      
      removed_node= None
      for node_ in nodes:
        if node_== node:
          removed_node= node_
      nodes.remove(removed_node)
      
      for neighbor in removed_node.neighbors:
        del neighbor.neighbors[node]

  return data


filenames= ["teco", "sigapl"]

for filename in filenames:
  nodes= {}

  json_object= json.loads(open("data_small/"+ filename+ ".json", "r").read())

  for author in json_object["authors"]:
    nodes[author]= Node(author)

  for article in json_object["articles"]:
    for author in article["authors"]:
      for collaborator in article["authors"]:
        if author == collaborator:
          continue

        if nodes[collaborator] not in nodes[author].neighbors:
          nodes[author].neighbors[nodes[collaborator]]= 1
        else:
          nodes[author].neighbors[nodes[collaborator]]+= 1

  nodes_= []
  for author in nodes:
    nodes_.append(nodes[author])

  data= find_k_densest_subgraphs(nodes_, 5)
  open(filename+ "_clusters.json", "w").write(json.dumps(data))

if False:
  nodes= []
  edges= []

  #load nodes and edges
  #build node instances
  #(we presume the input will be in form of separate node and edge lists)

  a= Node("a")
  b= Node("b")
  c= Node("c")
  d= Node("d")
  e= Node("e")
  f= Node("f")
  g= Node("g")
  h= Node("h")
  i= Node("i")
  j= Node("j")
  k= Node("k")
  l= Node("l")
  m= Node("m")
  n= Node("n")
  o= Node("o")
  p= Node("p")
  q= Node("q")
  r= Node("r")
  s= Node("s")
  t= Node("t")
  u= Node("u")

  a.neighbors= [b, c, d, e, n]
  b.neighbors= [a, c, d, e, n]
  c.neighbors= [a, b, d, e, n]
  d.neighbors= [a, b, c, e, n]
  e.neighbors= [a, b, c, d, n]
  f.neighbors= [g, u, h, i, j]
  g.neighbors= [f, u, h, o, i]
  h.neighbors= [f, g, o, u, q]
  i.neighbors= [f, g, o]
  j.neighbors= [n, f, k]
  k.neighbors= [j, l, m]
  l.neighbors= [p, m, k]
  m.neighbors= [l, k]
  n.neighbors= [a, b, c, d, e, j]
  o.neighbors= [i, h, g]
  p.neighbors= [l]
  q.neighbors= [t, r, s, h]
  r.neighbors= [q, t, s]
  s.neighbors= [r, t, q]
  t.neighbors= [q, r, s]
  u.neighbors= [f, g, h]

  nodes= {a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u}

  for node in nodes:
    for neighbor in node.neighbors:
      if node not in neighbor.neighbors:
        print "network incorrect, fixing..."
        neighbor.neighbors.append(node)

  for i in range(3):
    
    print "\n\nSubgraph", i
    densest_subgraph_nodes= GetDensestSubgraph(nodes)

    print "densest subgraph:"
    for node in densest_subgraph_nodes:
      print node.name, ":",
      for neighbor in node.neighbors:
        print neighbor.name, ",",
      
      print ""


    for node in densest_subgraph_nodes:
      print "removing", node.name
      
      removed_node= None
      for node_ in nodes:
        if node_== node:
          removed_node= node_
      nodes.remove(removed_node)
      
      for neighbor in removed_node.neighbors:
        neighbor.neighbors.remove(node)
    

