// SelectionDetail keeps the selection detail info panel up to date
// use select_journal and select_author to update the display
// with what the user has currently selected.
// TODO: This should just take an event handler
var SelectionDetail = function(event_handler) {
	this.author_info_div = d3.select("#author_info");
	this.journal_info_div = d3.select("#journal_info");

	this.article_html =
		'<div class="panel-heading">' +
			'<h3 id="title" class="panel-title">Article Title</h3>' +
		'</div>' +
		'<div class="panel-body">' +
			'<label for="authors">Authors:</label>' +
			'<ul id="authors"></ul>' +
			'<label for="year">Year Published:</label>' +
			'<p id="year"></p>' +
			'<a id="doi" href=""></a>' +
		'</div>';

	// Setup ourself to listen for events we want
	this.event_handler = event_handler;
	var self = this;
	event_handler.on("index_loaded.selection_detail", function(index, authors) {
		self.index_loaded(index, authors);
	});
	event_handler.on("journal_selected.selection_detail", function(journal, clusters, stats) {
		self.select_journal(journal);
	});
	event_handler.on("author_selected.selection_detail", function(author_id) {
		self.author_selected(author_id);
	});
	event_handler.on("brush_changed.selection_detail", function(start, end) {
		self.select_years(start, end);
	});
}
SelectionDetail.prototype.index_loaded = function(index, authors) {
	this.authors = authors;
	console.log("will show index summary");
	console.log(index);
}
// Update the selection detail panel to display information about the
// journal selected by the user
SelectionDetail.prototype.select_journal = function(journal) {
	this.journal = journal;
	this.journal_info_div.style("display", "");
	this.author_info_div.style("display", "none");

	this.journal_info_div.select("#journal_title").text(journal.title);
	this.journal_info_div.select("#journal_article_count").text(journal.num_articles);
	this.journal_info_div.select("#journal_years").html(journal.first_year + " &ndash; " + journal.latest_year);

	// Select and update the journals's article panels, adding/removing as needed
	var publications = this.journal_info_div.select("#journal_papers_list");
	var article_list = publications.selectAll(".panel")
		.data(journal.articles);
	article_list.exit().remove();
	article_list.enter().append("div")
		.attr("class", "panel panel-default")
		.html(this.article_html);
	var self = this;
	article_list.each(function(d) { self.update_article(d3.select(this), d); });
}
SelectionDetail.prototype.author_selected = function(author_id) {
	this.select_author(this.authors[author_id]);
}
// Update the selection detail panel to display information about the
// author currently selected by the user.
SelectionDetail.prototype.select_author = function(author) {
	this.journal_info_div.style("display", "none");
	this.author_info_div.style("display", "");
	this.author_info_div.select("#author_name").text(author.name);
	this.author_info_div.select("#author_affiliation").text(author.affiliation);

	// Clear any collaborators that were shown previously and replace them
	// with this author's collaborators
	var collaborators = this.author_info_div.select("#author_collaborators_list");
	collaborators.html("");

	// Select and update the author's article panels, adding/removing as needed
	var publications = this.author_info_div.select("#author_papers_list");
	var article_list = publications.selectAll(".panel")
		.data(author.articles);
	article_list.exit().remove();
	article_list.enter().append("div")
		.attr("class", "panel panel-default")
		.html(this.article_html);
	var self = this;
	article_list.each(function(d) { self.update_article(d3.select(this), d); });
}
SelectionDetail.prototype.update_article = function(element, article) {
	element.select("#title").html(article.title);
	var self = this;
	var author_list = element.select("#authors").selectAll("li")
		.data(article.authors);
	author_list.exit().remove();
	author_list.enter().append("li")
		.append("a")
		.attr("href", "javascript:void(0)")
	author_list.select("a")
		.on("click", function(d) {
			self.event_handler.author_selected(d);
		})
		.text(function(d, i) {
			return self.authors[d].name;
		});
	element.select("#year").html(article.year);
	element.select("#doi").html(article.doi)
		.attr("href", article.doi);
}
SelectionDetail.prototype.select_years = function(start, end) {
	console.log("TODO: WILL selection detail select years");
}

