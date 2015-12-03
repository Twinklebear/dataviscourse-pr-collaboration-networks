function BrushView(){
    var self = this;
    self.margin = {top: 20, right: 40, bottom: 30, left: 40};
    self.width = document.getElementById("brush").offsetWidth - self.margin.left - self.margin.right;
    self.height = 200 - self.margin.top - self.margin.bottom;
    self.data;
    self.dislayYear = [];

    for(var i = brushYearStart; i<=brushYearEnd; i+=10)
        self.dislayYear.push(i);
    // Scales
    self.x = d3.scale.ordinal().rangeRoundBands([0, self.width - 60], .1);
    self.y = d3.scale.linear().range([self.height, 0]);

    // Prepare the barchart canvas
    self.barchart = d3.select("#brush").append("svg")
        .attr("class", "barchart")
        .attr("width", self.width)
        .attr("height", self.height + self.margin.top + self.margin.bottom)
        .attr("y", self.height - self.height - 80)
        .append("g");

    self.z = d3.scale.ordinal().range(["steelblue", "indianred"]);

    self.brushYears = self.barchart.append("g")
    self.brushYears.append("text")
        .attr("id", "brushYears")
        .classed("yearText", true)
        .text(brushYearStart + " - " + brushYearEnd)
        .attr("x", 35)
        .attr("y", 12);
}



BrushView.prototype.setData = function(value)
{
    var self = this;
    self.data = value;
    // self.update(self.data);
}

