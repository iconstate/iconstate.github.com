var newline = "\n";

var IconStateApp = function() {
	var self = this;

	self.app_data = { cache: {}, icon: {}, category: {}, trackName: {}, result: {} };

	self.iconstate_plist_textarea = ko.observable("");
	self.iconstate_plist_textarea_new = ko.observable("");

	self.iconstate_plist = {};
	self.sort_by_name = ko.observable(false);
	self.sort_by_category = ko.observable(false);
	self.group_by_category = ko.observable(false);

	self.iconstate_pages = ko.observableArray([]);


	self.cell_data = function(iconstate_cell, iconstate_cell_category) {

		var cell = {
			title: iconstate_cell,
			folder: false,
			icon: ko.observable("http://placehold.it/57x57"),
			category: ko.observable(iconstate_cell_category),
			trackName: ko.observable("")
		};

		cell.hover_title = ko.computed(function(){ return this.trackName() + "\n"  + this.title + "\n"  + this.category() }, cell);

		if (self.app_data.cache[iconstate_cell] == 2)
		{
				cell.icon(self.app_data.icon[iconstate_cell]);
				cell.category(self.app_data.category[iconstate_cell]);
				cell.trackName(self.app_data.trackName[iconstate_cell]);
		}
		else if (!self.app_data.cache[iconstate_cell])
		{
			$.getJSON("http://itunes.apple.com/lookup?callback=?&bundleId=" + iconstate_cell, function(app) {


				self.app_data.cache[iconstate_cell] = 1;

				// console.log(iconstate_cell, app);
				if (app.results && app.results.length > 0)
				{
					cell.icon(app.results[0].artworkUrl60);
					cell.category(app.results[0].primaryGenreName);
					cell.trackName(app.results[0].trackName);

					self.app_data.icon[iconstate_cell] = app.results[0].artworkUrl60;
					self.app_data.category[iconstate_cell] = app.results[0].primaryGenreName;
					self.app_data.trackName[iconstate_cell] = app.results[0].trackName;
					self.app_data.result[iconstate_cell] = app.results[0];

					self.app_data.cache[iconstate_cell] = 2;
				}


			});
		}

		return cell;
	};

	self.sort_iconstate_pages = function() {		

			if (self.sort_by_name() || self.sort_by_category() || self.group_by_category()) {

				var pages = [];
				var apps_from_pages = [];
				var sorted_pages = [];

				pages = self.iconstate_pages();

				ko.utils.arrayForEach(pages, function(page) {

					if (page.ignore())
					{
						sorted_pages.push(page);
					}
					else
					{
						ko.utils.arrayForEach(page.iconstate_cells, function(iconstate_cell) {

							if (iconstate_cell.folder)
							{
								ko.utils.arrayForEach(iconstate_cell.folder, function(iconstate_cell_cell) {

										apps_from_pages.push(iconstate_cell_cell);
									
								});	
							}
							else
							{
								apps_from_pages.push(iconstate_cell);
							}
							
						});	
					}

				});		

				apps_from_pages.sort(function(a,b){ return a.trackName().localeCompare(b.trackName())});

				if (self.sort_by_category() || self.group_by_category()) 
				{
					apps_from_pages.sort(function(a,b){ return a.category().localeCompare(b.category())});
				}
				
				if (apps_from_pages.length > 0 && self.group_by_category())
				{
					var current_page = 0;
					var current_page_cell = 0;
					var current_folder_cell = 0;
					var current_category = apps_from_pages[0].category();


					for (var i=0; i < apps_from_pages.length; i++)
					{

						if (current_folder_cell % 12 == 0 || current_category != apps_from_pages[i].category() )
						{

							if (current_page_cell % 16 == 0)
							{
								sorted_pages.push({iconstate_cells:[], ignore: ko.observable(false)});
							}

							current_category = apps_from_pages[i].category();
							current_folder_cell = 0;

							var folder = { title: current_category, folder: [], icon: "img/folder.png", category: current_category, trackName: current_category, hover_title: "Folder: " + current_category };

							sorted_pages[sorted_pages.length-1].iconstate_cells.push(folder);
							current_page_cell++;
						}

						var current_folder = sorted_pages[sorted_pages.length-1].iconstate_cells.length-1;

						sorted_pages[sorted_pages.length-1].iconstate_cells[current_folder].folder.push(apps_from_pages[i]);
						current_folder_cell++;
					}

				}
				else
				{

					for (var i=0; i < apps_from_pages.length; i++)
					{
						if (i % 16 == 0)
						{
							sorted_pages.push({iconstate_cells:[], ignore: ko.observable(false)});
						}
						sorted_pages[sorted_pages.length-1].iconstate_cells.push(apps_from_pages[i]);
					}

				}


				self.iconstate_pages(sorted_pages);

			}

	};


	self.load_iconstate_pages = function() {

		console.log("self.iconstate_pages_compute");

		var pages = [];

		try
		{
			eval("self.iconstate_plist = " + self.iconstate_plist_textarea() + ";");
		}
		catch (e) {}

		// eval("self.iconstate_plist = " + $("#iconstate-plist-textarea").val() + ";");
		//self.iconstate_plist(self.iconstate_plist_textarea);

		// console.log(self.iconstate_plist_textarea());
		// console.log(self.iconstate_plist);

		if ( ! (typeof self.iconstate_plist.iconLists === 'undefined') )
		{
			ko.utils.arrayForEach(self.iconstate_plist.iconLists, function(icon_list) {
				
				var page = { "iconstate_cells" : [], ignore: ko.observable(false) };

				ko.utils.arrayForEach(icon_list, function(iconstate_cell) {

					// console.log(typeof iconstate_cell);

					if (typeof iconstate_cell == "string")
					{
						page.iconstate_cells.push(self.cell_data(iconstate_cell, ""));
					}
					else
					{
						var folder_items = [];

						if (iconstate_cell.iconLists.length)

						ko.utils.arrayForEach(iconstate_cell.iconLists[0], function(folder_item) {

							folder_items.push(self.cell_data(folder_item, ""));

						});

						var folder = {title: iconstate_cell.displayName, folder: folder_items, icon: "img/folder.png", category: iconstate_cell.displayName, trackName: iconstate_cell.displayName, hover_title: "Folder: " + iconstate_cell.displayName  };

						page.iconstate_cells.push(folder);
					}

				});
				
				pages.push(page);

			});

		}

		//console.log(pages);

		self.iconstate_pages(pages);

	};

	self.iconstate_plist_textarea_new = ko.computed(function() {

			var pages = [];

			pages = self.iconstate_pages();

			var new_iconstate_plist = { buttonBar: self.iconstate_plist.buttonBar, iconLists: [] };

			ko.utils.arrayForEach(pages, function(page) {

				var new_page = [];

				ko.utils.arrayForEach(page.iconstate_cells, function(iconstate_cell) {

					if (iconstate_cell.folder)
					{
						var new_folder = { displayName: iconstate_cell.title != "" ? iconstate_cell.title : "no name", iconLists: [[]], listType: "folder" };

						ko.utils.arrayForEach(iconstate_cell.folder, function(iconstate_cell_cell) {

								new_folder.iconLists[0].push(iconstate_cell_cell.title);
							
						});	
						new_page.push(new_folder);
					}
					else
					{
						new_page.push(iconstate_cell.title);
					}
					
				});	

				new_iconstate_plist.iconLists.push(new_page);

			});		

			return JSON.stringify(new_iconstate_plist, null, 4);

	},self);


};

$(function(){

	ko.applyBindings(new IconStateApp()); 	

});