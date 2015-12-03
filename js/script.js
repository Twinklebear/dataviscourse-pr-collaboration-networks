var data_path = 'data_all/curated_data/',
	index = {},
	authors = {};

window.onload = function() {
	// Events:
	//
	// - index_loaded: Called when the journal index and author data has finished loading, callee is
	// 		passed the journal index and author JSON data
	//
	// - journal_selected: Called when a journal has been selected and its data has loaded
	// 		the callee is passed the JSON objects with the journal info, clusters and csv of stats
	// 		(TODO: what will the csv load too? an array?)
	//
	// - author_selected: Called when an author is selected, the callee is passed the author id
	//
	// - brush_changed: Called when the year brush changes, callee is passed the start and end years
	// 		of the selection
	//
	var dispatcher = d3.dispatch("index_loaded", "journal_selected",
			"author_selected", "brush_changed");

	var journal_picker = d3.select("#journal_picker");
	journal_picker.on("change", function(){
		console.log("Picking " + this.value);
		if (this.value !== "empty"){
			load_journal(index[this.value], dispatcher);
		}
	});

	var selection_detail = new SelectionDetail(dispatcher);
	var brushview = new BrushView(dispatcher);
	var mainview = new MainView(dispatcher);

	// Load the journal index and list of authors we've got
	d3.loadData()
		.json("index", data_path + "journal_index.json")
		.json("authors", data_path + "authors.json")
		.onload(function(data){
			index = data['index'];
			authors = data['authors'];
			// Append a no journal selected option
			journal_picker.append("option").html("Select a journal")
				.attr("value", "empty");
			// Setup the journal picker
			for (var key in index){
				// TODO: Some stupid shit going on with name of TIST not updating
				if (index.hasOwnProperty(key)){
					var j = index[key];
					console.log("appending journal " + j.title);
					journal_picker.append("option").html(j.title)
						.attr("value", key);
				}
			}
			dispatcher.index_loaded(index, authors);
		});
}
function load_journal(journal, dispatcher){
	d3.loadData()
		.json("journal", data_path + journal['file'])
		.json("clusters", data_path + journal['clusters'])
		.csv("stats", data_path + journal['stats'])
		.onload(function(data) {
			console.log("Loaded");
			var journal = data['journal'];
			var clusters = data['clusters'];
			var stats = data['stats'];
			dispatcher.journal_selected(journal, clusters, stats);
		});
}
