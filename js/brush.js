//similar to http://bl.ocks.org/emeeks/8899a3e8c31d4c5e7cfd
// The brush view allows the user to select ranges of years to view articles from
// and view a count of articles published by the journal or author per year
var BrushView = function(event_handler) {
    var self = this;
    this.brush_year_start = 1960;
    this.brush_year_end = 2015;

    this.width = d3.select("#brush").node().getBoundingClientRect().width;
    this.height = 300;
    this.svg = d3.select("#brush").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

	console.log("width = " + this.width);
    this.x_scale = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.5);
    this.y_scale = d3.scale.linear().range([this.height, 0]);

    this.x_axis = d3.svg.axis().scale(this.x_scale).orient("bottom");
    this.y_axis = d3.svg.axis().scale(this.y_scale).orient("left");

	this.bar_group = this.svg.append("g");
	this.bar_group.append("g").attr("class", "axis x_axis")
		.attr("transform", "translate(0, " + (this.height - 30) + ")");
	this.bar_group.append("g").attr("class", "axis y_axis")
		.attr("transform", "translate(30, 0)");

    this.brush = d3.svg.brush().x(this.x_scale)
		.on("brushend", function(){ self.select_brushed(); });

	this.svg.append("g")
		.attr("class", "brush")
		.attr("transform", "translate(0, 0)");

	// TODO: Emit a brush changed event when the brush is changed
	this.event_handler = event_handler;
	// Setup ourself to listen for events we want
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

	this.clear_brush();
	console.log("TODO: MIKE BrushView select journal");
	data.forEach(function (d) {
        d.count = +d.count;
        d.year = d3.time.format("%Y").parse(d.year).getFullYear();
    });
	console.log(data);

	this.x_scale.domain(data.map(function(d) { return d.year; }));
	this.y_scale.domain([0, d3.max(data.map(function(d) { return d.count; }))]);
	this.y_axis.scale(this.y_scale);

	this.bar_group.select(".x_axis").call(this.x_axis)
		.selectAll("text")
        .attr("transform", "rotate(90)");
	this.bar_group.select(".y_axis").call(this.y_axis);

	var bars = this.bar_group.selectAll("rect")
		.data(data);
	bars.exit().remove();
	bars.enter().append("rect").attr("class", "bar")
		.attr("x", function(d) {
			return self.x_scale(d.year);
		})
		.attr("width", this.x_scale.rangeBand());
	bars.attr("y", function(d) {
			return self.y_scale(d.count);
		})
		.attr("height", function(d) {
			return self.height - self.y_scale(d.count);
		});

	this.svg.select(".brush").call(this.brush)
		.selectAll("rect")
		.attr("height", this.height);
}
BrushView.prototype.author_selected = function(author) {
	// TODO: Show histogram of author's publication
	console.log("TODO: MIKE BrushView author selected");
	this.clear_brush();
}
BrushView.prototype.select_brushed = function() {
	console.log("TODO: WILL BrushView select brushed");
	var scale = d3.scale.linear().domain(this.x_scale.domain()).range(this.x_scale.range());
	var extent = this.brush.extent();
	console.log("extent = " + extent);
	var start = Math.ceil(scale.invert(extent[0]));
	var end = Math.ceil(scale.invert(extent[1]));

	console.log("start = " + start + ", end = " + end);
	// Snap the rect edges
	d3.select(".brush").transition().call(this.brush.extent([scale(start), scale(end)]));
	this.event_handler.brush_changed(start, end);
}
BrushView.prototype.clear_brush = function() {
	d3.select(".brush").call(this.brush.clear());
}

