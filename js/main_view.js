// TODO: Take journals, clusters, authors as params
var MainView = function(event_handler){
	// TODO: Emit an author selected event when an author is clicked.
	// Setup ourself to listen for events we want
	var self = this;
	self.event_handler = event_handler;
	self.height = height = 630,     // svg height
	self.width  = document.getElementById("main_view").offsetWidth,
	self.div = d3.select("#main_view");
	self.keypair = {};
	self.allCurated = [];
	self.allClustered = [];
	event_handler.on("index_loaded.main_view", function(index, authors) {
		self.index_loaded(index, authors);
	});
	event_handler.on("journal_selected.main_view", function(journal, clusters, stats) {
		self.allClustered = clusters;
		self.allCurated   = journal;
		self.select_journal(journal, clusters);
	});
	event_handler.on("author_selected.main_view", function(author_id) {
		self.author_selected(author_id);
	});
	event_handler.on("brush_changed.main_view", function(start, end) {
		self.brush_changed(start, end);
	});
}

MainView.prototype.index_loaded = function(index, authors) {
	this.displaySummaryGraph(index);
}
MainView.prototype.select_journal = function(journal, clusters) {
	// 			- show all authors
	//			- show edges based on article 
	// 			- show edges width based on the count
	var display_data = this.preprocessData(journal, clusters)
	this.display(display_data)
}
MainView.prototype.author_selected = function(author_id) {
	//Get author data
	var author = authors[author_id],
		nodes =[],
		links = [],
		node_id = 0,
		data = {"nodes":[], "links":[]},
		author_start_year=0,
		author_end_year = 0;
	
	nodes.push({"name":author.name, "affiliation":author.affiliation, "publications":author.articles.length, "group":node_id, 
				"author_id":author_id, "node_id":node_id, "start_year":0, "end_year":0});
	node_id++;
	//Find its network
	for(var i in author.articles){
		var article = author.articles[i];
		
		if(author_start_year===0&&author_end_year===0){
			author_start_year = article.year;
			author_end_year = article.year;
		}else if(article.year<author_start_year)
			author_start_year = article.year;
		else if(article.year > author_end_year)
			author_end_year = article.year;
		for(var j in article.authors){
			if(article.authors[j]!=author_id){
				var a = authors[article.authors[j]],
					start_year=0,
					end_year = 0;
				for(var k in a.articles){
					if(start_year===0&&end_year===0){
						start_year = a.articles[k].year;
						author_end_year = a.articles[k].year;
					}else if(a.articles[k].year<start_year)
						start_year = a.articles[k].year;
					else if(a.articles[k].year > end_year)
						end_year = a.articles[k].year;
				}
				nodes.push({"name":a.name, "affiliation":a.affiliation, "publications":a.articles.length, "group":node_id, 
							"author_id":article.authors[j], "node_id":node_id, "start_year": start_year, "end_year":end_year});
				links.push({"source":0, "target":node_id, "count":1, "value":1});
				node_id++;
			}
			
		}
	}
	nodes[0].start_year = author_start_year;
	nodes[0].end_year   = author_end_year;
	data.nodes = nodes;
	data.links = links;
	//Display
	this.display(data)
}
MainView.prototype.displaySelectedAuthors = function(author_data){

}

MainView.prototype.displaySummaryGraph = function(summary_data){
	var self = this;
	var w = self.width,
		h = self.height,
		nodes = [],
		links = [],
		maxArticles = 0,
		minArticles = 9000000,
		group = 0;

	var fill = d3.scale.category20();

	for(var i in summary_data){
		var node = summary_data[i];
		nodes.push({"name":node.title, "size":node.num_articles, "totalauthors":node.num_authors, "group":group, "value":i})
		if(node.num_articles>maxArticles)
			maxArticles = node.num_articles;
		if(node.num_articles<minArticles)
			minArticles = node.num_articles;
		group++;
	}

	var circleWidth = 100;
	var radius = d3.scale.linear()
				.domain([minArticles, maxArticles])
				.range([50, 120]);

	var vis = this.div;
	vis.selectAll("svg")
		.attr("opacity", 1)
		.transition()
		.duration(100)
		.attr("opacity", 0)
		.remove();

	vis = vis.append("svg")
			.attr("class", "summary")
			.attr("width", w)
			.attr("height", h);
	vis.style("background-color", "#232c32")
		.attr("opacity", 0)
		.transition()
		.duration(700)
		.attr("opacity", 1);

	var force = d3.layout.force()
				.nodes(nodes)
				.links([])
				.gravity(0.1)
				.charge(-2000)
				.linkDistance(1000)
				.size([w, h]);

	var link = vis.selectAll(".link")
				.data(links)
				.enter().append("line")
				.attr("class", "link")

	 var node = vis.selectAll("circle.node")
				.data(nodes)
				.enter().append("g")
				.attr("class", "node")
				.on("mouseover", function(d,i) {
					d3.select(this).selectAll("circle")
						.transition()
						.duration(250)
						.attr("r", function(d){return radius(d.size)+5})
						.attr("fill",function(d){return fill(d.group)})
						.attr('fill-opacity', 1);

					d3.select(this).select("text")
						.transition()
						.duration(250)
						// .style("cursor", "none")     
						.attr("font-size","2.0em")
						.attr("fill", "white")
						.attr("x",function(d, i) {return radius(d.size)/3; })
						.attr("y",function(d, i) { return radius(d.size)/3;})
				})
				.on("mouseout", function(d,i) {
					d3.select(this).selectAll("circle")
					.transition()
					.duration(250)
					.attr("r", function(d){return radius(d.size)})
					.attr("fill",function(d){return fill(d.group)})
					.attr('fill-opacity', 0.85)

					d3.select(this).select("text")
					.transition()
					.duration(250)
					.attr("font-size","1.5em")
					.attr("color", "white")
					.attr("x",function(d, i) {return radius(d.size)/5; })
					.attr("y",function(d, i) { return radius(d.size)/5;})
				})
				.on("dblclick", function(d){
					load_journal(index[d.value], self.event_handler);
				})
				.call(force.drag);

	node.append("svg:circle")
		.attr("opacity", 0)
		.transition()
		.duration(700)
		.attr("opacity", 0.85)
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; })
		.attr("r", function(d){return radius(d.size)})
		.attr("fill",function(d){return fill(d.group)})
		.attr('fill-opacity', 0.85)

	//TEXT
	node.append("text")
		.attr("opacity", 0)
		.transition()
		.duration(700)
		.attr("opacity", 1)
		.text(function(d, i) { return d.name; })
		.attr("x",    function(d, i) {return radius(d.size)/5; })
		.attr("y",            function(d, i) { return radius(d.size)/5;})
		.attr("font-size",    function(d, i) {  return  "1.5em"; })
		.attr("font-color", "white");

	force.on("tick", function(e) {
		node.attr("transform", function(d, i) {     
			return "translate(" + d.x + "," + d.y + ")"; 
		});
		link.attr("x1", function(d)   { return d.source.x; })
			.attr("y1", function(d)   { return d.source.y; })
			.attr("x2", function(d)   { return d.target.x; })
			.attr("y2", function(d)   { return d.target.y; })
	});

	force.start();
}

MainView.prototype.preprocessData = function(journal, clusters){
	//Generate All nodes and edges
	var data = {"nodes":[], "links":[]},
		authors = journal.authors,
		articles = journal.articles,
		clusters_detail = clusters.clusters,
		node_index = 0,
		nodes = [],
		edges = [],
		cluster_group ={};
	this.keypair={}; //match for author_id - node_index;
	var keypair= this.keypair;
	// console.log(articles)

	//get cluster infor
	var cluster_size = Object.keys(clusters_detail).length;
	for(var i =0; i<cluster_size; i++){
		var cluster = clusters_detail["Cluster"+i];
		for(var j in cluster.authors){
			cluster_group[cluster.authors[j]] = {"cluster_id": i, "density":cluster.density};
		}
	}
	//node is generated
	var individualNode = 3;
	// for(var i in authors){
	for(var i =0; i<authors.length; i++){
		var author_node;
		var authorid = authors[i]; 
		if(cluster_group[authorid])
			author_node={"node_id": node_index, "author_id": authorid, "cluster_id": cluster_group[authorid].cluster_id, 
						"density": cluster_group[authorid].density, "start_year":0, "end_year":0,
						"group":cluster_group[authorid].cluster_id};
		else{
			author_node={"node_id": node_index, "author_id": authorid, "cluster_id":cluster_size+individualNode, "density":0,"start_year":0, "end_year":0, 
						"group":cluster_size+individualNode};
			individualNode++;
		}
		nodes.push(author_node);
		keypair[authorid] = node_index;
		node_index++;
		
	}

	//get author's publishing years (first and last) for filter
	//generate edges based on authors in articles
	var edge_withCount = {};
	var everyNode = false;  //if include curated nodes
	if(everyNode){
		for(var i in articles){
			var article = articles[i];
			var article_authors = article.authors;
			for(var j = 0; j<article_authors.length; j++){
				var authorid = article_authors[j];
				var node = nodes[keypair[authorid]]
				if(node){
					//check publication year
					if(nodes[keypair[authorid]]['start_year'] === 0 && nodes[keypair[authorid]]['end_year'] === 0){
						nodes[keypair[authorid]]['start_year'] = article.year;
						nodes[keypair[authorid]]['end_year'] = article.year;
					}else if(article.year< nodes[keypair[authorid]]['start_year'])
						nodes[keypair[authorid]]['start_year'] = article.year;
					else if(article.year> nodes[keypair[authorid]]['end_year'])
						nodes[keypair[authorid]]['end_year'] = article.year;
				}else{
					//for the authors that was missed in JSON
					var author_node={"node_id": node_index, "author_id": authorid, "cluster_id":-1, "density":-1,"start_year":article.year, "end_year":article.year};
					nodes.push(author_node);
					keypair[authorid] = node_index;
					node_index++;
				}
			}
			//all users are in nodes
			//offically generate edges
			for(var j = 0; j<article_authors.length; j++){
				var authorid = article_authors[j];
				for(var k =j+1; k<article_authors.length; k++){
					//create edge
					var key = authorid+'-'+article_authors[k];
					if(edge_withCount[key])
						edge_withCount[key].count++;
					else
						edge_withCount[key] = {"count":1, "source":keypair[authorid], "target":keypair[article_authors[k]]};
				}
			}
		}
	}
	else{
		for(var i in articles){
			var article = articles[i];
			var article_authors = article.authors;
			for(var j = 0; j<article_authors.length; j++){
				var authorid = article_authors[j];
				var node = nodes[keypair[authorid]]
				if(node){
					for(var k =j+1; k<article_authors.length; k++){
						//create edge
						if(article_authors[k]&&keypair[article_authors[k]]){
							var key;
							if(authorid>article_authors[k])
								key = authorid+'-'+article_authors[k];
							else
								key = article_authors[k]+'-'+authorid;
							if(edge_withCount[key])
								edge_withCount[key].count++;
							else
								edge_withCount[key] = {"count":1, "source":keypair[authorid], "target":keypair[article_authors[k]]};
						}
					}
					//check publication year
					// console.log(authorid)
					// console.log(keypair[authorid])
					// console.log(nodes[keypair[authorid]])
					if(nodes[keypair[authorid]]['start_year'] === 0 && nodes[keypair[authorid]]['end_year'] === 0){
						nodes[keypair[authorid]]['start_year'] = article.year;
						nodes[keypair[authorid]]['end_year'] = article.year;
					}else if(article.year< nodes[keypair[authorid]]['start_year'])
						nodes[keypair[authorid]]['start_year'] = article.year;
					else if(article.year> nodes[keypair[authorid]]['end_year'])
						nodes[keypair[authorid]]['end_year'] = article.year;
				}
			}
		}
	}
	// console.log(edge_withCount)

	// cluster edges
	// for(var i =0; i<cluster_size; i++){
	// 	var cluster = clusters_detail["Cluster"+i];
	// 	for(var j in cluster.authors){
	// 		var authorid = cluster.authors[j];
	// 		for(var k =j+1; k<cluster.authors.length; k++){
	// 			if(article_authors[k]){
	// 				var key = authorid+'-'+article_authors[k];
	// 				if(edge_withCount[key])
	// 					edge_withCount[key].count++;
	// 				else
	// 					edge_withCount[key] = {"count":1, "source":keypair[authorid], "target":keypair[article_authors[k]]};
	// 			}
	// 		}
	// 	}
	// }
	for(var i in edge_withCount)
		edges.push(edge_withCount[i])

	data.nodes = nodes;
	data.links = edges;
	return data;
}


MainView.prototype.display = function(data){
	var self = this;
	self.div.attr("opacity", 0.8)
		.transition()
		.duration(300)
		.attr("opacity", 0)
		.selectAll("svg")
		.remove();

	var height = self.height,     // svg height
		width = self.width,
		dr = 4,      // default point radius
		off = 15,    // cluster hull offset
		expand = {}, // expanded clusters
		net, force, hullg, hull, linkg, link, nodeg, node;
	
	var size = d3.scale.pow().exponent(1)
			  .domain([1,100])
			  .range([8,24]);
	
	var min_zoom = 0.1;
	var max_zoom = 7;
	var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])
	var nominal_stroke = 1.5;
	var max_stroke = 4.5;
	var max_base_node_size = 36;
	var nominal_base_node_size = 8;
	
	var curve = d3.svg.line()
		.interpolate("cardinal-closed")
		.tension(.85);
	
	var fill = d3.scale.category20();

	var vis = self.div;

	vis = vis.append("svg");
	
	vis.attr("class", "col-md-12")
		.attr("height", height);

	hullg = vis.append("g");
	linkg = vis.append("g");
	nodeg = vis.append("g");

	function noop() { return false; }

	function nodeid(n) {
	  return n.size ? "_g_"+n.group : n.author_id;
	}

	function linkid(l) {
	  var u = nodeid(l.source),
	      v = nodeid(l.target);
	  return u<v ? u+"|"+v : v+"|"+u;
	}

	function getGroup(n) { return n.group; }

	// constructs the network to visualize
	function network(data, prev, index, expand) {
		expand = expand || {};
		var gm = {},    // group map
		  nm = {},    // node map
		  lm = {},    // link map
		  gn = {},    // previous group nodes
		  gc = {},    // previous group centroids
		  nodes = [], // output nodes
		  links = []; // output links

		// process previous nodes for reuse or centroid calculation
		if (prev) {
			prev.nodes.forEach(function(n) {
			  var i = index(n), o;
			  if (n.size > 0) {
			    gn[i] = n;
			    n.size = 0;
			  } else {
			    o = gc[i] || (gc[i] = {x:0,y:0,count:0});
			    o.x += n.x;
			    o.y += n.y;
			    o.count += 1;
			  }
			});
		}

		// determine nodes
		for (var k=0; k<data.nodes.length; ++k) {
		var n = data.nodes[k],
		    i = index(n),
		    l = gm[i] || (gm[i]=gn[i]) || (gm[i]={group:i, size:0, nodes:[]});

		if (expand[i]) {
		  // the node should be directly visible
		  nm[n.author_id] = nodes.length;
		  nodes.push(n);
		  if (gn[i]) {
		    // place new nodes at cluster location (plus jitter)
		    n.x = gn[i].x + Math.random();
		    n.y = gn[i].y + Math.random();
		  }
		} else {
		  // the node is part of a collapsed cluster
		  if (l.size == 0) {
		    // if new cluster, add to set and position at centroid of leaf nodes
		    nm[i] = nodes.length;
		    nodes.push(l);
		    if (gc[i]) {
		      l.x = gc[i].x / gc[i].count;
		      l.y = gc[i].y / gc[i].count;
		    }
		  }
		  l.nodes.push(n);
		}
		// always count group size as we also use it to tweak the force graph strengths/distances
		l.size += 1;
		n.group_data = l;
		}

		for (i in gm) { gm[i].link_count = 0; }

		// determine links
		for (k=0; k<data.links.length; ++k) {
		var e = data.links[k],
		    u = index(e.source),
		    v = index(e.target);
		if (u != v) {
		gm[u].link_count++;
		gm[v].link_count++;
		}
		u = expand[u] ? nm[e.source.author_id] : nm[u];
		v = expand[v] ? nm[e.target.author_id] : nm[v];
		var i = (u<v ? u+"|"+v : v+"|"+u),
		    l = lm[i] || (lm[i] = {source:u, target:v, size:0});
		l.size += 1;
		}
		for (i in lm) { links.push(lm[i]); }

		return {nodes: nodes, links: links};
	}

	function convexHulls(nodes, index, offset) {
		var hulls = {};

		// create point sets
		for (var k=0; k<nodes.length; ++k) {
			var n = nodes[k];
			if (n.size) continue;
			var i = index(n),
			    l = hulls[i] || (hulls[i] = []);
			l.push([n.x-offset, n.y-offset]);
			l.push([n.x-offset, n.y+offset]);
			l.push([n.x+offset, n.y-offset]);
			l.push([n.x+offset, n.y+offset]);
		}

		// create convex hulls
		var hullset = [];
		for (i in hulls) {
			hullset.push({group: i, path: d3.geom.hull(hulls[i])});
		}
		// console.log(hullset)
		return hullset;
	}

	function drawCluster(d) {
		return curve(d.path); // 0.8
	}

// --------------------------------------------------------
	
	for (var i=0; i<data.links.length; ++i) {
		o = data.links[i];
		o.source = data.nodes[o.source];
		o.target = data.nodes[o.target];
	}

	init();

	vis.attr("opacity", 1e-6)
		.transition()
		.duration(1500)
		.attr("opacity", 1);

	var tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden");

	function init() {
		if (force) force.stop();
		net = network(data, net, getGroup, expand);

		force = d3.layout.force()
			.nodes(net.nodes)
			.links(net.links)
			.size([width, height])
			.linkDistance(function(l, i) {
				var n1 = l.source, n2 = l.target;
				// larger distance for bigger groups:
				// both between single nodes and _other_ groups (where size of own node group still counts),
				// and between two group nodes.
				//
				// reduce distance for groups with very few outer links,
				// again both in expanded and grouped form, i.e. between individual nodes of a group and
				// nodes of another group or other group node or between two group nodes.
				//
				// The latter was done to keep the single-link groups ('blue', rose, ...) close.
				return 60 +
				Math.min(30 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
					(n2.size || (n1.group != n2.group ? n2.group_data.size : 0))), -30 + 
					30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
					(n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
					100);
				//return 150;
			})
			.linkStrength(function(l, i) {return 1;})
			.gravity(0.1)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
			.charge(-700)    // ... charge is important to turn single-linked groups to the outside
			.friction(0.2)   // friction adjusted to get dampened display: less bouncy bouncy ball [Swedish Chef, anyone?]
			.start();

		hullg.selectAll("path.hull").remove();
		hull = hullg.selectAll("path.hull")
			.data(convexHulls(net.nodes, getGroup, off))
			.enter().append("path")
			.attr("class", "hull")
			.attr("d", drawCluster)
			.style("fill", function(d) { return fill(d.group); })
			.on("dblclick", function(d) {
				expand[d.group] = false; 
				init();
			});
			
		link = linkg.selectAll("line.link").data(net.links, linkid);
		link.exit().remove();
		link.enter().append("line")
			.attr("class", "link")
			.attr("x1", function(d) { return d.source.x+2; })
			.attr("y1", function(d) { return d.source.y+2; })
			.attr("x2", function(d) { return d.target.x+2; })
			.attr("y2", function(d) { return d.target.y+2; })
			.style("stroke-width", function(d) { 
				return d.size || 1; 
			});

		node = nodeg.selectAll("circle.node")
				.data(net.nodes, nodeid);

		node.exit().remove();
		var circle = node.enter().append("circle")
			// if (d.size) -- d.size > 0 when d is a group node.
			.attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
			.attr("r", function(d) { return d.size ? d.size + dr : dr+1; })
			.attr("cx", function(d) { 
				// if(d.node_id==0) return 30; else return d.x+2;
				return d.x; 
			})
			.attr("cy", function(d) { 
				// if(d.node_id==0) return 30; else return d.y+2; 
				return d.y;
			})
			.style("fill", function(d) { 
				// if(!expand[d.group]) return fill(d.group); else return fill(d.group*2+d.cluster_id);
				return fill(d.group); 
			})
			.on("dblclick", function(d) {
				tooltip.text("").style("visibility", "hidden");
				expand[d.group] = !expand[d.group];
				init();
			})
			.on("click", function(d){
				//TODO: hightlight
				// console.log("CLICKED: ", d)
				tooltip.text("").style("visibility", "hidden");
				if(!d.nodes)
					self.event_handler.author_selected(d.author_id);
				else if(d.size==1)
					self.event_handler.author_selected(d.nodes[0].author_id);
			})
			.on("mouseover", function(d){
				console.log(d);
				if(d.size==1){
					if(d.nodes[0].name){
						var n = d.nodes[0];
						return tooltip.text(n.name + ", " + n.affiliation).style("font-size", "2.0em").style("background-color","white").style("visibility", "visible");
					}
					else
						return tooltip.text("").style("visibility", "visible");
				}
				
			})
			.on("mousemove", function(d){
				return tooltip.style("top", (d3.event.pageY)+5+"px").style("left",(d3.event.pageX)+40+"px");
			})
			.on("mouseout", function(d){
				return tooltip.text("").style("visibility", "hidden");
			});
			// .on("mousewheel.zoom", function(d) { d3.event.stopPropagation();
		 //    	var dcx = (width/2-d.x*zoom.scale());
		 //    	var dcy = (height/2-d.y*zoom.scale());
		 //    	zoom.translate([dcx,dcy]);
		 //    	nodeg.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
			// });

		node.call(force.drag);

		force.on("tick", function(e) {
			var k = 6 * e.alpha;
			if (!hull.empty()) {
				hull.data(convexHulls(net.nodes, getGroup, off))
					.attr("d", drawCluster);
			}

			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		});

		zoom.on("zoom", function() {
			var stroke = nominal_stroke;
			if (nominal_stroke*zoom.scale()>max_stroke) stroke = max_stroke/zoom.scale();
			link.style("stroke-width",stroke);
			circle.style("stroke-width",stroke);
			var base_radius = nominal_base_node_size;
			// if (nominal_base_node_size*zoom.scale()>max_base_node_size) base_radius = max_base_node_size/zoom.scale();
			//     circle.attr("d", d3.svg.symbol()
			//     .size(function(d) { return Math.PI*Math.pow(size(10)*base_radius/nominal_base_node_size||base_radius,2); })
			//     .type(function(d) { return d.type; }))
			hullg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			linkg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			// circle.attr("r", function(d) { return (size(10)*base_radius/nominal_base_node_size||base_radius); })
			nodeg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		});

		vis.call(zoom);
	}
}
