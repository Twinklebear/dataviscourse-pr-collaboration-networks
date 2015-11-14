//d3.loadData : https://groups.google.com/forum/#!topic/d3-js/3hHke9ZKfQM
// or can use queue() https://groups.google.com/forum/#!msg/d3-js/3Y9VHkOOdCM/YnmOPopWUxQJ
//            <script src="https://cdnjs.cloudflare.com/ajax/libs/queue-async/1.0.7/queue.min.js"></script>

d3.loadData = function() { 
	var loadedCallback = null; 
	var toload = {}; 
	var data = {}; 
	var loaded = function(name, d) { 
		delete toload[name]; 
		data[name] = d; 
		return notifyIfAll(); 
	}; 
	var notifyIfAll = function() { 
		if ((loadedCallback != null) && d3.keys(toload).length === 0) 
		{ loadedCallback(data); } 
	}; 
	var loader = { 
		json: function(name, url) { 
			toload[name] = url;
			d3.json(url, function(d) { 
				return loaded(name, d); 
			})
			return loader; 
		}, 
		csv: function(name, url) { 
			toload[name] = url; 
			d3.csv(url, function(d) { 
				return loaded(name, d); 
			}); 
			return loader; 
		}, 
		onload: function(callback) { 
			loadedCallback = callback; 
			notifyIfAll(); 
		} 
	}; 
	return loader; 
}; 


var hull_path = function(d){
	return "M" + d3.geom.hull(d.values.map(function(i){ return [i.x, i.y]; })).join("L") + "Z";
}

var datapath = 'data/';
var newline = '</br>';
var journal1;
var journal2;
var authors;

function displayAuthor(d){
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
	document.getElementById('author_info').innerHTML = msg;
}

function displayAuthor2(d){
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
	document.getElementById('author_info2').innerHTML = msg;
}

function visualizeit(){
	var main_width = 960;
	var main_height = 700;
	var fill = d3.scale.category10();
	var groupFill = function(d, i) { return fill(i < journal1.num_authors ? 1 : 2); };
	var sum_authors = journal1.num_authors + journal2.num_authors;
	var nodes = d3.range(sum_authors).map(Object);
	var groups = d3.nest().key(function(d){ return d < journal1.num_authors ? 1 : 2;}).entries(nodes);
	
	var main_view = d3.select("#convex_hulls").append("svg")
		.attr("width", main_width)
		.attr("height", main_height);
	var force = d3.layout.force()
		.nodes(nodes)
		.links([])
		.size([main_width, main_height])
		.start();

	var circles = main_view.selectAll("circle")
		.data(nodes);

	circles.enter().append("circle")
		.attr("cx", function(d){return d.x; })
		.attr("cy", function(d){return d.y; })
		.attr("r", 8)
		.style("fill", "blue")
		.call(force.drag)
		.on("click", function(d){ 
			displayAuthor(d)
		});

	force.on("tick", function(e){
		// Push different journal groups in different directions for clustering
		var k = 6 * e.alpha;
		nodes.forEach(function(o, i){
			o.x += i < journal1.num_authors ? k : -k;
			o.y += i <journal1.num_authors ? k : -k;
		});

		circles.attr("cx", function(d){ return d.x; })
			.attr("cy", function(d){ return d.y; });

		main_view.selectAll("path")
			.data(groups).attr("d", hull_path)
			.enter().insert("path", "circle")
			.style("fill", groupFill)
			.style("stroke", groupFill)
			.style("stroke-width", 40)
			.style("stroke-linejoin", "round")
			.style("opacity", .2)
			.attr("d", hull_path);
	});
}

function directedGraph(){
	var width = 960,
	height = 500;

	var color = d3.scale.category20();

	var force = d3.layout.force()
		.charge(-10)
		.linkDistance(30)
		.size([width, height]);

	var svg = d3.select("#force_directed").append("svg")
		.attr("width", width)
		.attr("height", height);

	var sum_authors = journal1.num_authors + journal2.num_authors;
	var nodes = d3.range(sum_authors).map(Object);

	var links = [];
	for(var i = 0; i<authors.length; i++){
		var author = authors[i];
		if(author.articles.length>0){
			for(var j = 0; j<author.articles.length; j++){
				for(var k = 0; k<author.articles[j].authors.length; k++)
					if(author.articles[j].authors[k] != i)
						links.push({"source":i,"target":author.articles[j].authors[k], "value": i < journal1.num_authors ? 1 : 2})
			}
		}
	}

	force
		.nodes(nodes)
		.links(links)
		.start();

	var link = svg.selectAll(".link")
		.data(links)
		.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	var node = svg.selectAll(".node")
		.data(nodes)
		.enter().append("circle")
		.attr("class", "node")
		.attr("r", 5)
		.style("fill", function(d) { return color(d < journal1.num_authors ? 1 : 2); })
		.call(force.drag)
		.on("click", function(d){ 
			displayAuthor2(d)
		});

	node.append("title")
		.text(function(d) { return authors[d].name; });

	force.on("tick", function(e) {
		var k = 6 * e.alpha;
		nodes.forEach(function(o, i){
			o.x += i < journal1.num_authors ? k : -k;
			o.y += i <journal1.num_authors ? k : -k;
		});
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	});
}

function bundleNodes(){
	var width = 960,     // svg width
		height = 600,     // svg height
		dr = 4,      // default point radius
		off = 15,    // cluster hull offset
		expand = {}, // expanded clusters
		data, net, force, hullg, hull, linkg, link, nodeg, node;

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
				.attr("width", width)
				.attr("height", height);

	var sum_authors = journal1.num_authors + journal2.num_authors;
	var nodes = [];//d3.range(sum_authors).map(Object);
	for(var i = 0; i<authors.length; i++){
		nodes.push({"name":authors[i].name, "group":i<journal1.num_authors? 1:2});
	}
	console.log(nodes);
	data = {"nodes":[], "links":[]};
	data.nodes = nodes;
	var links = [];
	for(var i = 0; i<authors.length; i++){
		var author = authors[i];
		if(author.articles.length>0){
			for(var j = 0; j<author.articles.length; j++){
				for(var k = 0; k<author.articles[j].authors.length; k++)
					if(author.articles[j].authors[k] != i)
						links.push({"source":i,"target":author.articles[j].authors[k], "value": i < journal1.num_authors ? 1 : 2})
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
				return 20 +
				Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
					(n2.size || (n1.group != n2.group ? n2.group_data.size : 0))), -30 + 
					30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
					(n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
					100);
				//return 150;
			})
			.linkStrength(function(l, i) {
			return 1;
		})
		.gravity(0.05)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
		.charge(-90)    // ... charge is important to turn single-linked groups to the outside
		.friction(0.1)   // friction adjusted to get dampened display: less bouncy bouncy ball [Swedish Chef, anyone?]
		.start();

		hullg.selectAll("path.hull").remove();
		hull = hullg.selectAll("path.hull")
			.data(convexHulls(net.nodes, getGroup, off))
			.enter().append("path")
			.attr("class", "hull")
			.attr("d", drawCluster)
			.style("fill", function(d) { return fill(d.group); })
			.on("click", function(d) {
				expand[d.group] = false; init();
			});

		link = linkg.selectAll("line.link").data(net.links, linkid);
		link.exit().remove();
		link.enter().append("line")
			.attr("class", "link")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; })
			.style("stroke-width", function(d) { return d.size || 1; });

		node = nodeg.selectAll("circle.node").data(net.nodes, nodeid);
		node.exit().remove();
		node.enter().append("circle")
			// if (d.size) -- d.size > 0 when d is a group node.
			.attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
			.attr("r", function(d) { return d.size ? d.size + dr : dr+1; })
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
			.style("fill", function(d) { return fill(d.group); })
			.on("click", function(d) {
				expand[d.group] = !expand[d.group];
				init();
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
	}
}

function loadJson(){
	d3.loadData()
		.json("sigapl", datapath+"sigapl.json")
		.json("authors", datapath+"authors.json")
		.json("teco", datapath+"teco.json")
		.onload(function(data){
			journal1 = data['sigapl'];
			journal2 = data['teco'];
			authors = data['authors'];
			visualizeit()
			directedGraph()
			bundleNodes()
		});
}

window.onload = function(){	
	datapath = 'data2/'
	loadJson();
}

