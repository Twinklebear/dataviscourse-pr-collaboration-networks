// SelectionDetail keeps the selection detail info panel up to date
// use select_journal and select_author to update the display
// with what the user has currently selected.
var SelectionDetail = function(journals, authors) {
	this.author_info_div = d3.select("#author_info");
	this.journal_info_div = d3.select("#journal_info");
	this.journal_picker = d3.select("#journal_picker");

	this.article_html =
		'<div class="panel-heading">' +
			'<h3 id="title" class="panel-title">Article Title</h3>' +
		'</div>' +
		'<div class="panel-body">' +
			'<label for="authors">Authors:</label>' +
			'<p id="authors"></p>' +
			'<label for="year">Year Published:</label>' +
			'<p id="year"></p>' +
			'<a id="doi" href=""></a>' +
		'</div>';

	this.journals = journals;
	this.authors = authors;

	// Hide the author info div as it's not currently being shown
	this.author_info_div.style("display", "none");
	// Also hide the journal info since we're not showing a journal either
	this.journal_info_div.style("display", "none");
	// Append the journals in the list to the picker
	for (var key in journals){
		if (journals.hasOwnProperty(key)){
			var j = journals[key];
			console.log("appending journal " + j.title);
			this.journal_picker.append("option").html(j.title)
				.attr("value", j.short_name);
		}
	}
	// Start by selecting the first journal
	//this.select_journal(journals[Object.keys(journals)[0]]);
	var self = this;
	// TODO: We should also emit an event that the d3 visualization can pick up
	this.journal_picker.on("change", function(){
		self.select_journal(self.journals[this.value]);
	});

	// Debugging: pick an author
	this.select_author(authors[400]);
}
// Update the selection detail panel to display information about the
// journal selected by the user
SelectionDetail.prototype.select_journal = function(journal) {
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
	var author_list = element.select("#authors").selectAll("a")
		.data(article.authors);
	author_list.exit().remove();
	author_list.enter().append("a")
		.attr("href", "javascript:void(0)");
	author_list.on("click", function(d) {
			self.select_author(self.authors[d]);
		})
		.text(function(d, i) {
			if (i + 1 < article.authors.length) {
				return self.authors[d].name + ", ";
			} else {
				return self.authors[d].name;
			}
		});
	element.select("#year").html(article.year);
	element.select("#doi").html(article.doi)
		.attr("href", article.doi);
}

