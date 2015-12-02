# Final Report

Authors: Kevin Wall, Mike Liu, Will Usher

## Timeline - may get integrated into process book section 

### Brainstorming

#### Networks

[pictures of nodetrix]
One of our members attended a talk by Jean-Daniel Fekete on visualization graphs using matrices (NodeTrix). 
This gave rise to the idea of using hierarchical nodes to represent dense subgraphs instead of small matrices. 

[pictures of possible graphs in gephi]
We looked at many different network/graph datasets available on the Stanford Network Analysis Project's website.
However, these graphs were extremely large and were in general not very rich in information, only describing
the graph itself and not telling much about the nodes.

[picture of dblp logo]
After talking with the instructor, we were put on the trail of dblp, which is a large database of research journals,
articles, and authors. We decided we could make use this data to generate collaboration networks.

### Project Proposal

[project proposal document]

### Early Work

We already new where our data was going to come from (the dblp database), and we knew what we wanted to do with it, 
but a major roadblock to development was still getting the specific data we wanted to show (or at least a 
representative sample) in the format we wanted it in. As an example, we anticipated that scraping the author 
affiliations could be an expensive task, so we needed to know what websites to target as soon as possible. Without 
knowing what journals we were going to use, this task could not begin. 

[picture of tool described below]
In order to find these journals, we began making tools to analyze the data. The first such tool was a simple python 
script that collected endpoint urls for a sample of publications within every journal in the dblp database and printed
out a their distribution, as well as which journals possesed the most links to publication databases. This told us 
where the articles were hosted and which journals had enough links to justify turning them into networks (we were 
concerned about getting author affiliations for all authors).

[pictures of initial networks]
The next tool we made was a script that generated a gml file describing a collaboration network drawn from a inputted
set of journals. This allowed for us to see the collaboration networks by opening the file with the graph visualization
program Gephi. Now we could actually begin to judge potential datasets. Some networks were too dense, some weren't dense
enough. Some had interesting structures we wished to visualize. 

This script was also useful because it formed a basis for future scripts. It showed how we could read the dblp database, 
demonstrated the need for a streaming xml parser due to the immense size of the database, and introduced an 
object-oriented model of Journals, Articles, and Authors. This made further analysis and processing much easier because
we could simply access lists of class instances with useful per-instance information such as links to other instances.
In addition, once we had a standard representation, it enabled better work paralellization.

[picture]
After looking at various datasets and online publication libraries and applying our own biases towards certain journals,
we settled on looking at journals that mainly used [acm website] and [ieee website] as their publication database, and a
few such journals were already in use, helping us test our methods and visualization.

[picture of early javascript visualizations]
In order to visualize these datasets however, we needed a file format useful for communicating everything we new about the
data, including information we computed offline, to the javascript that actually creates and controls the visualization.
This meant creating a new script that did essentially the same thing as the dblp to gml script, but instead outputted json
files. Now, finally, we could begin development of the visualization itself. 

[picture of dense subgraph test]
Meanwhile, we were also developing a method of finding dense subgraphs within the networks we were generating. After doing
some reasearch, we found a approximate algorithm for finding dense subgraphs whose time complexity was linear [citation].
We implemented this, and were able to begin generating json files that described clusters in the data.

### Milestone Report

[milestone report document]

### Final Work

[picture of curated and uncurated graphs]
It became clear that many of our datasets were simply too large to visualize given our current methods (and were thus
outside our scope). In order to reduce their size, we needed new tools to filter the data. This gave rise to two new
developments. First, we modified the densest subgraph script to, after finding the densest subgraphs, find all the nodes
connected to those subgraphs, and output the resulting graph as a modified version of the inputted json file. Second,
we created a script that moved between our json file format and gml. This allowed us not only to visualize our graphs
with Gephi, but also edit them with gephi and then turn them back into json files. This allowed us to create curated
collaboration networks with a manageable number of nodes. 

## Process Book

### Overview and Motivation

### Related Work

### Questions

### Data

### Exploratory Data Analysis

### Design Evolution

### Implementation

### Evalutation