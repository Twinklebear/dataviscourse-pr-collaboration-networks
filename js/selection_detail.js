// SelectionDetail keeps the selection detail info panel up to date
// use select_journal and select_author to update the display
// with what the user has currently selected.
var SelectionDetail = function(journals, authors) {
	this.author_info_div = d3.select("#author_info");
	this.journal_info_div = d3.select("#journal_info");
	this.journal_picker = d3.select("#journal_picker");

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
	this.select_journal(journals[Object.keys(journals)[0]]);
	var self = this;
	// TODO: We should also emit an event that the d3 visualization can pick up
	this.journal_picker.on("change", function(){
		self.select_journal(self.journals[this.value]);
	});

	// Debugging: pick an author
	//this.select_author(authors[400]);
}
// Update the selection detail panel to display information about the
// journal selected by the user
SelectionDetail.prototype.select_journal = function(journal) {
	this.journal_info_div.style("display", "");
	this.author_info_div.style("display", "none");

	this.journal_info_div.select("#journal_title").text(journal.title);
	this.journal_info_div.select("#journal_article_count").text(journal.num_articles);
	this.journal_info_div.select("#journal_years").html(journal.first_year + " &ndash; " + journal.latest_year);

	// Clear any publicatios that were shown previously and replace them with this journal's publications
	var publications = this.journal_info_div.select("#journal_papers_list");
	publications.html("");
	for (var i = 0; i < journal.articles.length; ++i){
		var article = journal.articles[i];
		var item = publications.append("li");
		item.html(article.title)
			.append("a").attr("href", article.doi).html(article.doi);
	}
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

	// Clear any publications that were shown previously and replace them
	// with this author's publications
	var publications = this.author_info_div.select("#author_papers_list");
	publications.html("");
	// TODO: instead of a ul/li we should have a list of divs that we stamp out
	// with info on the articles
	for (var i = 0; i < author.articles.length; ++i){
		var article = author.articles[i];
		var item = publications.append("li");
		item.html(article.title)
			.append("a").attr("href", article.doi).html(article.doi);
	}
}

