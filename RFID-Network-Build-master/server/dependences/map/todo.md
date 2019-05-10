* Get demo [Leaflet](https://leafletjs.com/) working
* Take box json object as input and create map with them (center map based on the box dimentions)
	* Sample json object:
	```
	[{"box":"T1","reader":"1","lat":"38.630280","lon":"-90.200310","fieldSite":"null","taggedDateTime":"2018-12-08 15:54:55","comment":"0","currentDraw":0,"currentSupply":0},
	 {"box":"T2","reader":"2","lat":"38.656057","lon":"-90.574203","fieldSite":"null","taggedDateTime":"2018-12-14 01:03:44","comment":"0","currentDraw":0,"currentSupply":0}]
	```
	* Allow the user to show or hide boxes
* Take bird json object as input and create map with them and box (center map based on the outliers)
	* Sample json object:
	```
	[{rfid: "A0B1C2D3E4", datetime: "2018-12-08 15:58:00", reader: "1", box: "T1", fieldSite: "T"},
	 {rfid: "A0B1C2D3E4", datetime: "2018-12-08 15:59:00", reader: "1", box: "T1", fieldSite: "T"},
	 {rfid: "1234567890", datetime: "2018-12-08 16:00:00", reader: "1", box: "T1", fieldSite: "T"},
	 {rfid: "1234567890", datetime: "2018-12-08 16:02:00", reader: "2", box: "T2", fieldSite: "T"},
	 {rfid: "A0B1C2D3E4", datetime: "2018-12-08 16:02:29", reader: "2", box: "T2", fieldSite: "T"}]
	```
	* Allow the user to show or hide birds
* Make a graph that can show movement of birds over time
	* Animate graph automatically
	* Let the user use a slide bar to pick the time
* Add a heat map option
