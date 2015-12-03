//similar to http://bl.ocks.org/emeeks/8899a3e8c31d4c5e7cfd

function BrushView(){
    var self = this;
    self.margin = {top: 20, right: 40, bottom: 40, left: 40};
    self.width = document.getElementById("brush").offsetWidth - self.margin.left - self.margin.right;
    self.height = 300 - self.margin.top - self.margin.bottom;
    // self.dislayYear = [];

    brushYearStart = yearStart;
    brushYearEnd = yearEnd;

    // for(var i = brushYearStart; i<=brushYearEnd; i+=10)
    //     self.dislayYear.push(i);
    self.z = d3.scale.ordinal().range(["steelblue", "indianred"]);
}

BrushView.prototype.loadData = function(datapath, journal){
    var self = this;
    x = d3.scale.ordinal().rangeRoundBands([0, self.width-60], .5);
    y = d3.scale.linear().range([self.height, 0]);
    
    d3.csv(datapath+journal['stats'], function (error, data) {
        data.forEach(function (d) {
            d["count"] = +d["count"];
            d["year"] = d3.time.format("%Y").parse(d["year"]).getFullYear();
        });
        var freqs = d3.layout.stack()(["count"].map(function (type) {
            return data.map(function (d) {
                return {
                    x: +d["year"],
                    y: +d[type]
                };
            });
        }));
        x.domain(freqs[0].map(function (d) {
            return d.x;
        }));

        y.domain([0, d3.max(freqs[freqs.length - 1], function (d) {
            return d.y0 + d.y;
        })]);
        self.update(freqs);
    });
}

BrushView.prototype.update = function(data){
    var self = this,
        margin = self.margin,
        height = self.height,
        width  = self.width,
        // x = self.x,
        // y = self.y,
        z = self.z;

    var barchart = d3.select("#brush");

    barchart.selectAll('svg').remove();

    barchart = barchart.append("svg")
        .attr("class", "barchart")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("y", height - height - 100)
        .append("g");

    brushYears = barchart.append("g")

    brushYears.append("text")
        .attr("id", "brushYears")
        .classed("yearText", true)
        .text(brushYearStart + " - " + brushYearEnd)
        .attr("x", 35)
        .attr("y", 12);

    // var preprocess = [];
    // for(var i =yearStart; i<=yearEnd; i++){
    //     if(data[i]){
    //         preprocess.push({"year": i, "count":data[i]});
    //     }
    //     else{
    //         preprocess.push({"year": i, "count":0});
    //     }
    // }

    // data = preprocess;

    // data.forEach(function (d) {
    //     d["count"] = +d["count"];
    //     d["year"] = d3.time.format("%Y").parse(d["year"]).getFullYear();
    // });

    // var freqs = d3.layout.stack()(["count"].map(function (type) {
    //     return data.map(function (d) {
    //         return {
    //             x: +d["year"],
    //             y: +d[type]
    //         };
    //     });
    // }));

    // x.domain(data[0].map(function (d) {
    //     return d.x;
    // }));

    // y.domain([0, d3.max(data[data.length - 1], function (d) {
    //     return d.y0 + d.y;
    // })]);

    // Axis variables for the bar chart
    x_axis = d3.svg.axis().scale(x).orient("bottom");
    y_axis = d3.svg.axis().scale(y).orient("right");

    // x axis
    barchart.append("g")
        .attr("class", "x axis")
        .style("fill", "#000")
        .attr("transform", "translate(0," + height + ")")
        .call(x_axis)
        .selectAll("text")
        .attr("y", -5) // magic number
        .attr("x", 20) // magic number
        .attr("transform", "rotate(90)");

    // y axis
    barchart.append("g")
        .attr("class", "y axis")
        .style("fill", "#000")
        .attr("transform", "translate(" + (width - 85) + ",0)")
        .call(y_axis);

    // Add a group for each cause.
    var freq = barchart.selectAll("g.freq")
        .data(data)
      .enter().append("g")
        .attr("class", "freq")
        .style("fill", function (d, i) {
            return z(i);
        })
        .style("stroke", "#CCE5E5");

    // Add a rect for each date.
    rect = freq.selectAll("rect")
        .data(Object)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return x(d.x);
        })
        .attr("y", function (d) {
            return y(d.y0) + y(d.y) - height;
        })
        .attr("height", function (d) {
            return height - y(d.y);
        })
        .attr("width", x.rangeBand())
        .attr("id", function (d) {
            return d["year"];
        });

    // Draw the brush
    brush = d3.svg.brush()
        .x(x)
        .on("brush", brushmove)
        .on("brushend", brushend);

    var arc = d3.svg.arc()
      .outerRadius(height / 15)
      .startAngle(0)
      .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

    brushg = barchart.append("g")
      .attr("class", "brush")
      .call(brush);

    brushg.selectAll(".resize").append("path")
        .attr("transform", "translate(0," +  height / 2 + ")")
        .attr("d", arc);

    brushg.selectAll("rect")
        .attr("height", height);
}

// ****************************************
// Brush functions
// ****************************************
BrushView.prototype.brushmove = function()
{
    // var self = this,
    //     y = self.y,
    //     x = self.x;
    
    y.domain(x.range()).range(x.domain());
    b = brush.extent();

    var localBrushYearStart = (brush.empty()) ? brushYearStart : Math.ceil(y(b[0])),
        localBrushYearEnd = (brush.empty()) ? brushYearEnd : Math.ceil(y(b[1]));

    // Snap to rect edge
    d3.select("g.brush").call((brush.empty()) ? brush.clear() : brush.extent([y.invert(localBrushYearStart), y.invert(localBrushYearEnd)]));

    // Fade all years in the histogram not within the brush
    d3.selectAll("rect.bar").style("opacity", function(d, i) {
      return d.x >= localBrushYearStart && d.x < localBrushYearEnd || brush.empty() ? "1" : ".4";
    });
}

BrushView.prototype.brushend = function()
{
    // var self = this,
    //     y = self.y,
    //     x = self.x;
    b = brush.extent();
    var localBrushYearStart = (brush.empty()) ? brushYearStart : Math.ceil(y(b[0])),
        localBrushYearEnd = (brush.empty()) ? brushYearEnd : Math.floor(y(b[1]));

    d3.selectAll("rect.bar").style("opacity", function(d, i) {
      return d.x >= localBrushYearStart && d.x <= localBrushYearEnd || brush.empty() ? "1" : ".4";
    });

  // Additional calculations happen here...
  // filterPoints();
  // colorPoints();
  // styleOpacity();

  // Update start and end years in upper right-hand corner of the map
  d3.select("#brushYears").text(localBrushYearStart == localBrushYearEnd ? localBrushYearStart : localBrushYearStart + " - " + localBrushYearEnd);

}

BrushView.prototype.resetBrush = function()
{
  brush
    .clear()
    .event(d3.select(".brush"));
}

BrushView.prototype.setData = function(value)
{
    var self = this;
    self.data = value;
    // self.update(self.data);
}

