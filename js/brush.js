//similar to http://bl.ocks.org/emeeks/8899a3e8c31d4c5e7cfd
// The brush view allows the user to select ranges of years to view articles from
// and view a count of articles published by the journal or author per year
var BrushView = function(event_handler) {
    var self = this;
	this.margin = { top: 10, right: 30, bottom: 50, left: 30 };
    this.brush_year_start = 1960;
    this.brush_year_end = 2015;

    this.width = d3.select("#brush").node().getBoundingClientRect().width - this.margin.left - this.margin.right;
    this.height = 300 - this.margin.top - this.margin.bottom;
    this.svg = d3.select("#brush").append("svg")
		.attr("width", this.width + this.margin.left + this.margin.right)
		.attr("height", this.height + this.margin.top + this.margin.bottom);

	console.log("width = " + this.width);
    this.x_scale = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.3);
    this.y_scale = d3.scale.linear().range([this.height, 0]);

    this.x_axis = d3.svg.axis().scale(this.x_scale).orient("bottom");
    this.y_axis = d3.svg.axis().scale(this.y_scale).orient("left")
		.tickFormat(d3.format("d"));

	this.group = this.svg.append("g")
		.attr("transform", "translate(" + this.margin.left + ", " + this.margin.top + ")");
	this.group.append("g").attr("class", "axis x_axis")
		.attr("transform", "translate(0, " + this.height + ")");
	this.group.append("g").attr("class", "axis y_axis");
	this.bar_group = this.group.append("g");

    this.brush = d3.svg.brush().x(this.x_scale)
		.on("brushend", function(){ self.select_brushed(); });

	this.group.append("g")
		.attr("class", "brush")
		.attr("transform", "translate(-3, 0)");

	this.event_handler = event_handler;
	// Setup ourself to listen for events we want
	event_handler.on("index_loaded.brush_view", function(index, authors) {
		self.authors = authors;
	});
	event_handler.on("journal_selected.brush_view", function(journal, clusters, stats) {
		self.select_journal(stats);
	});
	event_handler.on("author_selected.brush_view", function(author_id) {
		self.author_selected(author_id);
	});
}
// Display publication year counts for the selected journal
BrushView.prototype.select_journal = function(data) {
	var self = this;

	// Convert type of the CSV data to ints
	data.forEach(function (d) {
        d.count = +d.count;
        d.year = +d.year;
    });
	this.draw_histogram(data);
}
BrushView.prototype.author_selected = function(author_id) {
	var author = this.authors[author_id];
	// Build the article counts for each year from this author's articles
	var data = {};
	for (var i = 0; i < author.articles.length; ++i){
		var a = author.articles[i];
		if (!data[a.year]){
			data[a.year] = 1;
		} else {
			data[a.year] += 1;
		}
	}
	console.log(data);
	// Flatten to an array that draw_histogram expects
	data = Object.keys(data).map(function(k) {
		return { year: +k, count: data[k] };
	});
	this.draw_histogram(data);
}
BrushView.prototype.draw_histogram = function(data) {
	var self = this;
	this.x_scale.domain(d3.range(1960, 2016, 1));
	this.y_scale.domain([0, d3.max(data.map(function(d) { return d.count; }))]);
	this.y_axis.scale(this.y_scale);

	// Setup the x-axis labels
	this.group.select(".x_axis").call(this.x_axis)
		.selectAll("text")
        .attr("transform", "rotate(90)")
		.attr("x", 20)
		.attr("y", -8);
	this.group.select(".y_axis").call(this.y_axis);

	// Draw our bars
	var bars = this.bar_group.selectAll("rect")
		.data(data);
	bars.exit().remove();
	bars.enter().append("rect").attr("class", "bar")
		.attr("width", this.x_scale.rangeBand());
	bars.attr("x", function(d) {
			return self.x_scale(d.year);
		})
		.attr("y", function(d) {
			return self.y_scale(d.count);
		})
		.attr("height", function(d) {
			return self.height - self.y_scale(d.count);
		});

	this.clear_brush();
	this.svg.select(".brush").call(this.brush)
		.selectAll("rect")
		.attr("height", this.height);
}
BrushView.prototype.select_brushed = function() {
	var scale = d3.scale.linear().domain(this.x_scale.domain()).range(this.x_scale.range());
	var extent = this.brush.extent();
	console.log("extent = " + extent);
	var start = Math.ceil(scale.invert(extent[0]));
	var end = Math.ceil(scale.invert(extent[1]));
	if (end > 2016){
		end = 2016;
		start = end - 1;
	}

	console.log("start = " + start + ", end = " + end);
	// Snap the rect edges
	d3.select(".brush").transition().call(this.brush.extent([scale(start), scale(end)]));
	this.event_handler.brush_changed(start, end - 1);
}
BrushView.prototype.clear_brush = function() {
	d3.select(".brush").call(this.brush.clear());
}

