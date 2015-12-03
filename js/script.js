
function MainView(){
	
}

MainView.prototype.loadAuthorData = function(data_path){
	var self = this;
	d3.loadData()
		.json("authors", datapath+"authors.json")
		.onload(function(data){
			allauthors_data = data['authors']
		});
}

MainView.prototype.loadData = function(data_path, journal){
	var self = this;
	if(!this.allauthors_data)	this.loadAuthorData(data_path);
	d3.loadData()
		.json("journals", datapath+journal['file'])
		.json("clusters", datapath+journal['clusters'])
		.onload(function(data){
			journal_data = data['journals'];
			clusters_data = data['clusters'];
			self.getArticlesCount();
		});
}

MainView.prototype.getArticlesCount = function(){
	var annualCount = {};
	var articles = journal_data['articles'];
	articles.forEach(function(d){
		if(!annualCount[d['year']])
			annualCount[d['year']] = 0;
		annualCount[d['year']]+=1;
	});
	brushview.setData(annualCount);
}

MainView.prototype.loadJson = function(datapath, journal){
	var self = this;
	var datapath = 'data2/'
	d3.loadData()
		.json("sigapl", datapath+"sigapl.json")
		.json("authors", datapath+"authors.json")
		.json("teco", datapath+"teco.json")
		.onload(function(data){
			journal1 = data['sigapl'];
			journal2 = data['teco'];
			authors = data['authors'];
			self.update()
		});
}

MainView.prototype.displayAuthorInfo = function(d){
	var newline = '</br>';
	var author = authors[d]; 
	var msg = "Author Name: " + author.name + newline;
	for(var i = 0; i<author.articles.length; i++){
		var article = author.articles[i];
		msg+= "<a href="+ article.doi+ ">" + article.title + "</a>"+newline;
		msg+= "year: " + article.year + newline;
		if(article.authors.length>0){
			if(article.authors.length>1){
				msg+= "collaborators: ";
				for(var j = 0; j<article.authors.length; j++){
					if(article.authors[j] != d)
						if(j<article.authors.length-1)
							msg += authors[article.authors[j]].name + ", ";
						else
							msg += authors[article.authors[j]].name;
				}
				msg+= newline;
			}else{
				if(article.authors[0] != d)
					msg += "collaborators: "+ authors[article.authors[j]].name+ newline;
			}			
		}
	}
	document.getElementById('author_info3').innerHTML = msg;
}

MainView.prototype.update = function(){
	var self = this;

	var height = 600,     // svg height
		width = document.getElementById("bundle_nodes").offsetWidth,
		dr = 4,      // default point radius
		off = 15,    // cluster hull offset
		expand = {}, // expanded clusters
		data, net, force, hullg, hull, linkg, link, nodeg, node;
	
	var size = d3.scale.pow().exponent(1)
			  .domain([1,100])
			  .range([8,24]);
	
	var min_zoom = 0.001;
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

	function noop() { return false; }

	function nodeid(n) {
		return n.size ? "_g_"+n.group : n.name;
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
				nm[n.name] = nodes.length;
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
			u = expand[u] ? nm[e.source.name] : nm[u];
			v = expand[v] ? nm[e.target.name] : nm[v];
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
		return hullset;
	}

	function drawCluster(d) {
		return curve(d.path); // 0.8
	}

// --------------------------------------------------------
	var vis = d3.select("#bundle_nodes").append("svg")
				.attr("class", "col-md-12")
				.attr("height", height);

	var sum_authors = journal1.num_authors + journal2.num_authors;
	var nodes = [];//d3.range(sum_authors).map(Object);
	for(var i = 0; i<authors.length; i++){
		nodes.push({"name":authors[i].name, "group":i<journal1.num_authors? 1:2});
	}

	data = {"nodes":[], "links":[]};
	data.nodes = nodes;
	var links = [];
	for(var i = 0; i<authors.length; i++){
		var author = authors[i];
		for(var j = 0; j<author.articles.length; j++){
			var article = author.articles[j];
			for(var k = 0; k < article.authors.length; k++)
				if(article.authors[k] != i){
					links.push({"source":i,"target":article.authors[k], "value": i < journal1.num_authors ? 1 : 2})
				}
		}
	}
	
	data.links = links;
	for (var i=0; i<data.links.length; ++i) {
		o = data.links[i];
		o.source = data.nodes[o.source];
		o.target = data.nodes[o.target];
	}

	hullg = vis.append("g");
	linkg = vis.append("g");
	nodeg = vis.append("g");

	init();

	vis.attr("opacity", 1e-6)
		.transition()
		.duration(1000)
		.attr("opacity", 1);

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
			.gravity(0.05)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
			.charge(-100)    // ... charge is important to turn single-linked groups to the outside
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
				expand[d.group] = false; init();
			});
			
		link = linkg.selectAll("line.link").data(net.links, linkid);
		link.exit().remove();
		link.enter().append("line")
			.attr("class", "link")
			.attr("x1", function(d) { return d.source.x+2; })
			.attr("y1", function(d) { return d.source.y+2; })
			.attr("x2", function(d) { return d.target.x+2; })
			.attr("y2", function(d) { return d.target.y+2; })
			.style("stroke-width", function(d) { return d.size || 1; });

		node = nodeg.selectAll("circle.node")
				.data(net.nodes, nodeid);

		node.exit().remove();
		var circle = node.enter().append("circle")
			// if (d.size) -- d.size > 0 when d is a group node.
			.attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
			.attr("r", function(d) { return d.size ? d.size + dr : dr+1; })
			.attr("cx", function(d) { return d.x+2; })
			.attr("cy", function(d) { return d.y+2; })
			.style("fill", function(d) { return fill(d.group); })
			.on("dblclick", function(d) {
				expand[d.group] = !expand[d.group];
				init();
			})
			.on("click", function(d){
				if(!d.nodes)
					self.displayAuthorInfo(d.index);
			})
			.on("mousewheel.zoom", function(d) { d3.event.stopPropagation();
		    	var dcx = (width/2-d.x*zoom.scale());
		    	var dcy = (height/2-d.y*zoom.scale());
		    	zoom.translate([dcx,dcy]);
		    	nodeg.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
			});

		node.call(force.drag);

		force.on("tick", function(e) {
			var k = 6 * e.alpha;
			nodes.forEach(function(o, i){
				o.x += i < journal1.num_authors ? k : -k;
				o.y += i <journal1.num_authors ? k : -k;
			});
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

