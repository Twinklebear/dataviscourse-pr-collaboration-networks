# Datavis project: Visualization of Collaboration Networks

Authors: Kevin Wall, Mike Liu, Will Usher

# Project Milestone

The milestone report is under [milestone\_report.pdf](milestone_report.pdf). Since our data is a bit too
large to include in the repository you can see our running prototype at [link](http://www.sci.utah.edu/~mliu/datavis/).

# Documentation

- `dblp_to_json.py`: This is our script to generate the reduced/simplified JSON format
read by our D3 visualization from the selected set of journals in the DBLP XML database.
- `journal_filters.json`: This file specifies the short names of the journals we want to
select from the database when running `dblp_to_json.py`
- `scrape_affiliation.py`: This module provides methods for scraping the different publisher
web pages for author affiliation information.
- `index.html`: Our visualization HTML page
- `js/*` Various JS written to create the visualization, currently just contains one file,
`script.js` containing the prototype

