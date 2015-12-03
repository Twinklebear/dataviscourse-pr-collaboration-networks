// SelectionDetail keeps the selection detail info panel up to date
// use select_journal and select_author to update the display
// with what the user has currently selected.
var SelectionDetail = function(event_handler) {
	this.journal_index_div = d3.select("#journal_index");
	this.author_info_div = d3.select("#author_info");
	this.journal_info_div = d3.select("#journal_info");

	// Current journal or author being shown
	this.author = null;
	this.journal = null;

	this.authors = null;

	// Template for information about an article in the journal or author
	// we're showing
	this.article_html =
		'<div class="panel-heading">' +
			'<h3 id="title" class="panel-title"></h3>' +
		'</div>' +
		'<div class="panel-body">' +
			'<label for="authors">Authors:</label>' +
			'<ul id="authors"></ul>' +
			'<label for="year">Year Published:</label>' +
			'<p id="year"></p>' +
			'<a id="doi" href=""></a>' +
		'</div>';

	// Template for information about a journal in the index
	this.journal_index_html =
		'<div class="panel-heading">' +
			'<h3 id="title" class="panel-title"></h3>' +
		'</div>' +
		'<div class="panel-body">' +
			'<label for="authors">Number of Authors:</label>' +
			'<p id="authors"></p>' +
			'<label for="articles">Number of Articles:</label>' +
			'<p id="articles"></p>' +
			'<label for="journal_years">Years in Database:</label>' +
			'<p id="journal_years"></p>' +
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
	this.show_index(index);
}
SelectionDetail.prototype.show_index = function(index) {
	// Hide the author and journal info divs
	this.author_info_div.style("display", "none");
	this.journal_info_div.style("display", "none");
	this.journal_index_div.style("display", "");

	// Select and update the journal info panels
	var journals = this.journal_index_div.select("#journal_index_list");
	var journal_list = journals.selectAll(".panel")
		.data(Object.keys(index));
	journal_list.exit().remove();
	journal_list.enter().append("div")
		.attr("class", "panel panel-default")
		.html(this.journal_index_html);
	var self = this;
	journal_list.each(function(d) { self.update_journal_index(d3.select(this), index[d]); });
}
SelectionDetail.prototype.update_journal_index = function(element, journal) {
	element.select("#title").html(journal.title);
	element.select("#authors").text(journal.num_authors);
	element.select("#articles").text(journal.num_articles);
	element.select("#journal_years").html(journal.first_year + " &ndash; " + journal.latest_year);
}
// Update the selection detail panel to display information about the
// journal selected by the user
SelectionDetail.prototype.select_journal = function(journal, article_filter) {
	this.author_info_div.style("display", "none");
	this.journal_index_div.style("display", "none");
	this.journal_info_div.style("display", "");

	// Toggle that we're in the journal view and save the journal
	this.journal = journal;
	this.author = null;

	this.journal_info_div.select("#journal_title").text(journal.title);
	this.journal_info_div.select("#journal_article_count").text(journal.num_articles);
	this.journal_info_div.select("#journal_years").html(journal.first_year + " &ndash; " + journal.latest_year);

	// Select and update the journals's article panels, adding/removing as needed
	var publications = this.journal_info_div.select("#journal_papers_list");
	var articles = journal.articles;
	if (article_filter !== undefined){
		articles = articles.filter(article_filter);
	}
	var article_list = publications.selectAll(".panel")
		.data(articles);
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
SelectionDetail.prototype.select_author = function(author, article_filter) {
	this.journal_info_div.style("display", "none");
	this.journal_index_div.style("display", "none");
	this.author_info_div.style("display", "");

	// Toggle that we're in the author view and save the author
	this.journal = null;
	this.author = author;

	this.author_info_div.select("#author_name").text(author.name);
	this.author_info_div.select("#author_affiliation").text(author.affiliation);

	// Select and update the author's article panels, adding/removing as needed
	var publications = this.author_info_div.select("#author_papers_list");
	var articles = author.articles;
	if (article_filter !== undefined){
		articles = articles.filter(article_filter);
	}

	// Build list of frequent collaborators for this author
	var collaborators = {};
	for (var i = 0; i < articles.length; ++i){
		var authors = articles[i].authors;
		for (var j = 0; j < authors.length; ++j){
			if (authors[j] != author.id){
				if (!collaborators[authors[j]]){
					collaborators[authors[j]] = 1;
				} else {
					collaborators[authors[j]] += 1;
				}
			}
		}
	}
	// A bit ugly here, dump it into an array now so we can sort by the count in
	// descending order
	collaborators = Object.keys(collaborators).map(function(k) {
		return [k, collaborators[k]];
	});
	collaborators.sort(function(a, b) {
		return b[1] - a[1];
	});
	// We count frequent collaborators as the top 25% of people they worked with
	// TODO: Better method. Pick those who've been collaborated with more than the average
	var num_collaborators = Math.ceil(0.25 * collaborators.length);
	// Take all people who have greater or equal to number of collaborations as the last
	// most frequent collaborator
	collaborators = collaborators.filter(function(d, i) {
		return i <= num_collaborators;
	});

	var self = this;
	// Clear any collaborators that were shown previously and replace them
	// with this author's collaborators
	var collaborator_list = this.author_info_div.select("#author_collaborators_list");
	var frequent_collaborators = collaborator_list.selectAll("li")
		.data(collaborators);
	frequent_collaborators.exit().remove();
	frequent_collaborators.enter().append("li")
		.append("a")
		.attr("href", "javascript:void(0)");
	frequent_collaborators.select("a")
		.on("click", function(d) {
			self.event_handler.author_selected(parseInt(d[0]));
		})
		.text(function(d, i) {
			return self.authors[parseInt(d[0])].name;
		});

	var article_list = publications.selectAll(".panel")
		.data(articles);
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
	// If we're in the journal view we want to filter the journal's articles
	// otherwise if we're in the author view filter the author's articles
	if (this.journal !== null){
		this.select_journal(this.journal, function(d) {
			return d.year >= start && d.year <= end;
		});
	} else if (this.author !== null){
		this.select_author(this.author, function(d) {
			return d.year >= start && d.year <= end;
		});
	}
}

