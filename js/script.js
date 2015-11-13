var hull_path = function(d){
	return "M" + d3.geom.hull(d.values.map(function(i){ return [i.x, i.y]; })).join("L") + "Z";
}


window.onload = function(){
	var main_width = 960;
	var main_height = 500;
	var nodes = d3.range(50).map(Object);

	var groups = d3.nest().key(function(d){ return d & 1; }).entries(nodes);

	var main_view = d3.select("#main_view").append("svg")
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
		.attr("cx", function(d){ return d.x; })
		.attr("cy", function(d){ return d.y; })
		.attr("r", 8)
		.style("fill", "blue")
		.call(force.drag);

	force.on("tick", function(e){
		// Push different journal groups in different directions for clustering
		var k = 6 * e.alpha;
		nodes.forEach(function(o, i){
			o.x += i & 1 ? k : -k;
			o.y += i & 1 ? k : -k;
		});
		circles.attr("cx", function(d){ return d.x; })
			.attr("cy", function(d){ return d.y; });
		main_view.selectAll("path")
			.data(groups).attr("d", hull_path)
			.enter().insert("path", "circle")
			.attr("d", hull_path);
	});
}

