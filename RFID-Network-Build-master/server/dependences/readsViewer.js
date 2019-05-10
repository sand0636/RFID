/*
 * Ben Duggan
 * 8/10/18
 * Script for subsetting and viewing reads
 */

// TODO: Handel the case where RFID, band, reader or box gets updated or added (should be somewhat simple socket)

let filters = {};
let numberOfEntries; //Stores the total number of filtered entries
let RFIDBandMap = {}; //Contains all the bandIDs for each RFID
let RFIDList = []; //Contains the list of all RFIDs
let readersBoxMap = {}; //Contains all the boxes for each readerID
let RFIDSexMap = {}; //Contains the sex assignment of each bandID
let readersList = []; //Contains all the readerIDs
let fieldSitesList = []; //Contains all fieldSites
let rfidCounts; //This holds the number of entries for each rfid-reader combination
let readerCounts; //This holds the nubmer of entries for each reader-rfid combination


// A class that helps handeling the chart
class chartManager {
  constructor(name, destination, data) {
    this.name = name;
    this.destination = destination;
    this.data = data;
    this.charts = {};
  }

  newData(data) {
    this.data = data;
  }

  // TODO: update specific chart when a new read comes in
  update(data) {
    this.data[Object.keys(data)[0]] = data[Object.keys(data)[0]];

    let dataset = [];
    let labels = [];
    for(var c in this.data[Object.keys(this.data)[0]]) {
      labels.push(c)
      dataset.push(this.data[Object.keys(this.data)[0]][c]);
    }

    // Create the chart
    let config = {
      type: 'pie',
      data: {
        datasets: [{
          data: dataset,
          backgroundColor: this.color(labels.length),
          label: Object.keys(this.data)[0]
        }],
        labels: labels
      },
      options: {
        responsive: true,
        title : {
          display: true,
          text: Object.keys(this.data)[0]
        }
      }
    };

    // Add the chart to the charts list
    this.charts[Object.keys(this.data)[0]] = {};
    this.charts[Object.keys(this.data)[0]]["config"] = config;

    // Add the chart to the screen
    window[this.name + Object.keys(this.data)[0]] = new Chart(document.getElementById(this.destination + '-' + Object.keys(this.data)[0]).getContext('2d'), config);

    window[this.name + Object.keys(this.data)[0]].update();
  }

  render() {
    $('#' + this.destination).empty();
    // Go through all of the data in the dataset
    for(var i=0; i<Object.keys(this.data).length; i++) {
      // Add a row if needed
      if(i%2 == 0) {
        $('#' + this.destination).append('<div id="'+this.destination+'Row'+i/2+'" class="row"></div>');
      }

      // Add chart area
      $('#' + this.destination+'Row' + Math.floor(i/2)).append('<div class="col-md-6"><canvas id="'+this.destination + '-' + Object.keys(this.data)[i] +'"> </canvas></div>');

      // Make dataset and label arrays
      let dataset = [];
      let labels = [];
      for(var c in this.data[Object.keys(this.data)[i]]) {
        labels.push(c)
        dataset.push(this.data[Object.keys(this.data)[i]][c]);
      }

      // Create the chart
      let config = {
        type: 'pie',
        data: {
          datasets: [{
      			data: dataset,
      			backgroundColor: this.color(labels.length),
      			label: Object.keys(this.data)[i]
      		}],
      		labels: labels
      	},
      	options: {
      		responsive: true,
          title : {
            display: true,
            text: Object.keys(this.data)[i]
          }
      	}
      };

      // Add the chart to the charts list
      this.charts[Object.keys(this.data)[i]] = {};
      this.charts[Object.keys(this.data)[i]]["config"] = config;

      // Add the chart to the screen
      window[this.name + Object.keys(this.data)[i]] = new Chart(document.getElementById(this.destination + '-' + Object.keys(this.data)[i]).getContext('2d'), config);

      window[this.name + Object.keys(this.data)[i]].update();
    }
  }

  // Get the color array
  color(size) {
    var arr = [];
    for(var i=0; i<size; i++) {
      switch(i) {
        case 0:
          arr.push(window.chartColors.red);
          break;
        case 1:
          arr.push(window.chartColors.blue);
          break;
        case 2:
          arr.push(window.chartColors.green);
          break;
        case 3:
          arr.push(window.chartColors.orange);
          break;
        case 4:
          arr.push(window.chartColors.purple);
          break;
        case 5:
          arr.push(window.chartColors.yellow);
          break;
        case 6:
          arr.push(window.chartColors.grey);
          break;
        default:
          arr.push()
      }
    }

    return arr;
  }

  // Get a random rgb value
  get randomRGB() {
    return 'rgb('+Math.floor(Math.random()*255)+', '+Math.floor(Math.random()*255)+', '+Math.floor(Math.random()*255)+')'
  }
}

let birdCharts = new chartManager('birds', 'readsViewer-analyticsBirdChart', {});
let boxCharts = new chartManager('box', 'readsViewer-analyticsReaderChart', {});

// Add elements to the DOM and add action listeners
$('document').ready(function() {
    // Load additionall scripts and styles to page (select2 and chart.js)
    $('body').append('<link href="/dependences/jsLibraries/select2/select2.min.css" rel="stylesheet" /><script src="/dependences/jsLibraries/select2/select2.min.js"></script><script src="/dependences/jsLibraries/Chart.js/Chart.bundle.js"></script><script src="/dependences/jsLibraries/Chart.js/utils.js"></script>');

    // Create the DOM skeleton for the RV
    $('#readsViewer').html('<hr /><lable>Filter: </lable><input type="checkbox" id="readsViewer-filterCheck" checked><div class="" id="readsViewer-filter"></div><br /><lable>Analytics: </lable><input type="checkbox" id="readsViewer-analyticsCheck" checked><p><strong>Number of entries: </strong><span id="readsViewer-numberOfEntries"></span></p><hr /><div class="" id="readsViewer-analytics"></div><hr /><label>Raw data: </label><input type="checkbox" id="readsViewer-rawDataCheck" checked><div class="table-responsive" style="display:block;" id="readsViewer-rawData"><lable>Max reads displayed (should be less than 500): </label><input type="text" class="form-control" id="readsViewer-maxRawReads" value="500"><table class="table table-striped"><thead><tr><th>RFID Tag</th><th>Band ID</th><th>Tagged date/time</th><th>Box</th><th>Reader</th></tr></thead><tbody id="readsViewer-tableBody"></tbody></table></div>');

    // Add the filters to the RV
    $('#readsViewer-filter').html('<form id="readsViewer-filter"><div class="row"><div class="col-md-4"><div class="form-group"><label>RFID: </label><select class="form-control js-example-basic-multiple" id="readsViewer-rfidFilter" name="states[]" multiple="multiple"></select></div></div><div class="col-md-4"><div class="form-group"><label>Band ID: </label><select class="form-control js-example-basic-multiple" id="readsViewer-bandFilter" name="states[]" multiple="multiple"></select></div></div><div class="col-md-4"><div class="form-group"><label>Reader: </label><select class="form-control js-example-basic-multiple" id="readsViewer-readerFilter" name="states[]" multiple="multiple"></select></div></div></div><div class="row"><div class="col-md-4"><div class="form-group"><label>Field site: </label><select class="form-control js-example-basic-multiple" id="readsViewer-fieldSiteFilter" name="states[]" multiple="multiple"></select></div></div><div class="col-md-4"><div class="form-group"><label>Box: </label><select class="form-control js-example-basic-multiple" id="readsViewer-boxFilter" name="states[]" multiple="multiple"></select></div></div>    <div class="col-md-4 left-right"><div class="form-group left"><label>Start date-time: </label><input type="date" class="form-control" id="readsViewer-startDate"><input type="time" class="form-control" id="readsViewer-startTime"></div><div class="form-group right"><label>End date-time: </label><input type="date" class="form-control" id="readsViewer-endDate"><input type="time" class="form-control" id="readsViewer-endTime"></div></div>  </div></form><div class="container"><div class="row"><div class="col-4"><button type="button" class="btn btn-primary" id="readsViewer-applyFilter">Apply filter</button></div><div class="col-4"><button type="button" class="btn btn-primary" id="readsViewer-clearFilter">Clear</button></div></div></div>');

    // Add the bird and box analytics to the page
    $('#readsViewer-analytics').html('<lable>Bird analytics</lable><input type="checkbox" id="readsViewer-analyticsBirdCheck" checked><div id="readsViewer-analyticsBird"><lable>Reads breakdown: </lable><input type="checkbox" id="readsViewer-analyticsBirdCountCheck" checked><div id="readsViewer-analyticsBirdCount" style="display:block;"><table class="table table-striped"><thead><tr><th>RFID</th><th>Band ID</th><th># of reads</th><th>% of reads</th><th>Visited readers:</th></tr></thead><tbody id="readsViewer-analyticsBirdCountTable"></tbody></table></div><lable>Bird charts: </lable><input type="checkbox" id="readsViewer-analyticsBirdChartCheck" checked><div id="readsViewer-analyticsBirdChart" class="container"></div></div><lable>Reader analytics</lable><input type="checkbox" id="readsViewer-analyticsReaderCheck" checked><div id="readsViewer-analyticsReader"><lable>Reads breakdown: </lable><input type="checkbox" id="readsViewer-analyticsReaderCountCheck" checked><div id="readsViewer-analyticsReaderCount" style="display:block;"><table class="table table-striped"><thead><tr><th>Reader</th><th>Current box</th><th># of reads</th><th>% of reads</th><th>Visited bands:</th></tr></thead><tbody id="readsViewer-analyticsReaderCountTable"></tbody></table></div><lable>Reader charts: </lable><input type="checkbox" id="readsViewer-analyticsReaderChartCheck" checked><div id="readsViewer-analyticsReaderChart" class="container"></div></div>');

    //rvLoad();

    /* User events */
    // Show/hide click handeling
    $('#readsViewer-filterCheck').click(function() {$('#readsViewer-filter').toggle(this.checked);}); //Toggle the filter
    $('#readsViewer-analyticsCheck').click(function() {$('#readsViewer-analytics').toggle(this.checked);}); //Toggle the analytics
    $('#readsViewer-analyticsBirdCheck').click(function() {$('#readsViewer-analyticsBird').toggle(this.checked);}); //Toggle the analytics bird view
    $('#readsViewer-analyticsBirdCountCheck').click(function() {$('#readsViewer-analyticsBirdCount').toggle(this.checked);}); //Toggle the reads breakdown
    $('#readsViewer-analyticsBirdChartCheck').click(function() {$('#readsViewer-analyticsBirdChart').toggle(this.checked);}); //Toggle the reader charts
    $('#readsViewer-analyticsReaderCheck').click(function() {$('#readsViewer-analyticsReader').toggle(this.checked);}); //Toggle the analytics reader view
    $('#readsViewer-analyticsReaderCountCheck').click(function() {$('#readsViewer-analyticsReaderCount').toggle(this.checked);}); //Toggle the reads breakdown
    $('#readsViewer-analyticsReaderChartCheck').click(function() {$('#readsViewer-analyticsReaderChart').toggle(this.checked);}); //Toggle the bird charts
    $('#readsViewer-rawDataCheck').click(function() {$('#readsViewer-rawData').toggle(this.checked);}); //Toggle the raw database

    // Apply the user defined filters
    $('#readsViewer-applyFilter').click(function() {
      if($('#readsViewer-rfidFilter').val().length > 0) {
        filters.rfid = [RFIDList[$('#readsViewer-rfidFilter').val()[0]]];
        for(var i=1; i<$('#readsViewer-rfidFilter').val().length; i++) {
            filters.rfid.push(RFIDList[$('#readsViewer-rfidFilter').val()[i]]);
        }
      }
      else {delete filters["rfid"];}
      if($('#readsViewer-bandFilter').val().length > 0) {
        filters.band = [RFIDBandMap[RFIDList[$('#readsViewer-bandFilter').val()[0]]]];
        for(var i=1; i<$('#readsViewer-bandFilter').val().length; i++) {
            filters.band.push(RFIDBandMap[RFIDList[$('#readsViewer-bandFilter').val()[i]]]);
        }
      }
      else {delete filters["band"];}
      if($('#readsViewer-boxFilter').val().length> 0) {
        filters.box = [readersBoxMap[readersList[$('#readsViewer-boxFilter').val()[0]]]];
        for(var i=1; i<$('#readsViewer-boxFilter').val().length; i++) {
            filters.box.push(readersBoxMap[readersList[$('#readsViewer-boxFilter').val()[i]]]);
        }
      }
      else {delete filters["box"];}
      if($('#readsViewer-fieldSiteFilter').val().length> 0) {
        filters.fieldSite = [$('#readsViewer-fieldSiteFilter').val()[0]];
        for(var i=1; i<$('#readsViewer-fieldSiteFilter').val().length; i++) {
            filters.fieldSite.push($('#readsViewer-fieldSiteFilter').val()[i]);
        }
      }
      else {delete filters["fieldSite"];}
      if($('#readsViewer-readerFilter').val().length > 0) {
        filters.reader = [readersList[$('#readsViewer-readerFilter').val()[0]]];
        for(var i=1; i<$('#readsViewer-readerFilter').val().length; i++) {
            filters.reader.push(readersList[$('#readsViewer-readerFilter').val()[i]]);
        }
      }
      else {delete filters["reader"];}
      if($('#readsViewer-startDate').val().length > 0 && $('#readsViewer-endDate').val().length > 0) {
        if($('#readsViewer-startTime').val()) {
          filters.startDate = $('#readsViewer-startDate').val() + " " + $('#readsViewer-startTime').val();
        }
        else {
          filters.startDate = $('#readsViewer-startDate').val() + " 00:00:01";
        }

        if($('#readsViewer-endTime').val()) {
          filters.endDate = $('#readsViewer-endDate').val() + " " + $('#readsViewer-endTime').val();
        }
        else {
          filters.endDate = $('#readsViewer-endDate').val() + " 00:00:01";
        }
      }
      else {delete filters["startDate"]; delete filters["endDate"];}

      numberOfEntries = -1;

      let maxReads = document.getElementById('readsViewer-maxRawReads').value == NaN || document.getElementById('readsViewer-maxRawReads').value == null ? 500 : document.getElementById('readsViewer-maxRawReads').value;
      socket.emit('rv-getReadsTable', {"maxReads":maxReads, "filter":filters}); //Get new table
      socket.emit('rv-getNumberOfEntries', filters); //Get the total number of entries in the reads database
      socket.emit('rv-getCounts', filters); //Get the rfidCounts and readerCounts
    });

    // Clear filter
    $('#readsViewer-clearFilter').click(function() {
      $('#readsViewer-rfidFilter').val(null).trigger('change');
      $('#readsViewer-bandFilter').val(null).trigger('change');
      $('#readsViewer-fieldSiteFilter').val(null).trigger('change');
      $('#readsViewer-boxFilter').val(null).trigger('change');
      document.getElementById('readsViewer-startDate').value = "";
      document.getElementById('readsViewer-startTime').value = "";
      document.getElementById('readsViewer-endDate').value = "";
      document.getElementById('readsViewer-endTime').value = "";
    });
});

/*** START - socket.on()s ***/
// Update when a rew read is sent
socket.on('newRead', function(data) {
  console.log(data);

  // Check to see if the new read is in the subseted data
  if(inSubset(data)) {
    let sex = "";
    switch(data.sex) {
      case 'Male':
        sex = '<span style="color:blue;">&#9794;</span>';
        break;
      case 'Female':
        sex = '<span style="color:pink;">&#9792</span>';
        break;
      default:
        sex = '<span style="color:black;">?</span>';
        break;
    }
    $('#readsViewer-tableBody').prepend('<tr><td class="rfid-tag"><a href="/birds.html?id='+data.rfid+'">'+data.rfid+'</a></td><td><a href="/birds.html?id='+data.rfid+'">'+RFIDBandMap[data.rfid]+'</a>'+sex+'</td><td class="date-time">'+new Date(data.dateTime).toSQLString()+'</td></td><td class="box"><a href="/boxes.html?reader='+data.reader+'">'+data.box+'</a></td><td class="reader"><a href="/boxes.html?reader='+data.reader+'">'+data.reader+'</a></td></tr>');

    numberOfEntries++;
    $('#readsViewer-numberOfEntries').html(numberOfEntries);

    // Update rfidCounts and readerCounts
    // Is there an initial entry in the rfidCounts list?
    if(typeof rfidCounts[data.rfid] !== 'undefined') {
      rfidCounts[data.rfid][data.reader]++;
    }
    else {
      rfidCounts[data.rfid] = {[data.reader] : 1};
    }

    // Is there an initial entry in the readerCounts list?
    if(readerCounts[data.reader]) {
      readerCounts[data.reader][data.rfid]++;
    }
    else {
      readerCounts[data.reader] = {[data.rfid] : 1};
    }

    rvLoadAnalytics();
    //rvLoadBreakdown();
    //birdCharts.update(rfidCounts[data.rfid]);
    //readerCounts.update(readerCounts[data.reader]);
  }
});

// Got the reads for the requested filter
socket.on('rv-readsTable', function(data){
    console.log(data);

    // Add to table
    $('#readsViewer-tableBody').html(''); //Clear table
    var d = data.content;
    let sex = "";
    for(var i=d.length-1; i>-1; i--) {
      sex = "";
      switch(RFIDSexMap[RFIDBandMap[d[i].rfid]]) {
        case 'Male':
          sex = '<span style="color:blue;">&#9794;</span>';
          break;
        case 'Female':
          sex = '<span style="color:pink;">&#9792</span>';
          break;
        default:
          sex = '<span style="color:black;">?</span>';
          break;
      }
      $('#readsViewer-tableBody').append('<tr><td class="rfid-tag"><a href="/birds.html?id='+d[i].rfid+'">'+d[i].rfid+'</a></td><td><a href="/birds.html?id='+d[i].rfid+'">'+RFIDBandMap[d[i].rfid]+'</a>'+sex+'</td><td class="date-time">'+new Date(d[i].datetime).toSQLString()+'</td></td><td class="box"><a href="/boxes.html?reader='+d[i].reader+'">'+d[i].box+'</a></td><td class="reader"><a href="/boxes.html?reader='+d[i].reader+'">'+d[i].reader+'</a></td></tr>');
    }
});

// Got the total number of entries in the reads database
socket.on('rv-numberOfEntries', function(data) {
  numberOfEntries = data.content[0]['COUNT(rfid)'];
  console.log(numberOfEntries);
  $('#readsViewer-numberOfEntries').html(numberOfEntries);
  rvLoadAnalytics();
});

// Got the current systemsVariables
socket.on('systemsVariables', function(data) {
  console.log(data);
  RFIDList = data["RFIDList"];
  RFIDBandMap = data["RFIDBandMap"];
  RFIDSexMap = data["RFIDSexMap"];
  readersList = data["readersList"];
  readersBoxMap = data["readersBoxMap"];
  fieldSitesList = data["fieldSitesList"];
  loadSmartSearch();
});

// Get the rfidCounts and readerCounts
socket.on('rv-counts', function(data) {
  console.log(data);
  rfidCounts = data["rfidCounts"];
  readerCounts = data["readerCounts"];
  rvLoadAnalytics();
})
/*** END - socket.on()s ***/

// Load data and construct table
function rvLoad() {
    $('#readsViewer').show();
    socket.emit('getSystemsVariables', null); //Get the system variables
    let maxReads = document.getElementById('readsViewer-maxRawReads').value == NaN || document.getElementById('readsViewer-maxRawReads').value == null ? 500 : document.getElementById('readsViewer-maxRawReads').value;
    socket.emit('rv-getReadsTable', {"maxReads":maxReads, "filter":filters}); //Get new table
    socket.emit('rv-getNumberOfEntries', filters); //Get the total number of entries in the reads database
    socket.emit('rv-getCounts', filters); //Get the rfidCounts and readerCounts
}

// Hide the data viewer
function rvHide() {
    $('#readsViewer').hide();
}

// Set the filter var and update the filter on client view
function rvSetFilter(filter) {
  filters = filter;
}

// Loads the select2 search and multiple options in
function loadSmartSearch() {
  let seenNull = false;
  let keysData = [];
  let valuesData = [];
  for(let i=0; i<RFIDList.length; i++) {
    if(RFIDBandMap[RFIDList[i]] == "" || RFIDBandMap[RFIDList[i]] == null) {
      if(!seenNull) {
        seenNull = true;
        valuesData.push({id:i, text:RFIDBandMap[RFIDList[i]]});
      }
    }
    else {
      valuesData.push({id:i, text:RFIDBandMap[RFIDList[i]]});
    }
    keysData.push({id:i, text:RFIDList[i]});
  }

  $('#readsViewer-rfidFilter').select2({
    data:keysData
  });
  $('#readsViewer-bandFilter').select2({
    data:valuesData
  });

  seenNull = false;
  keysData = [];
  valuesData = [];
  for(let i=0; i<readersList.length; i++) {
    if(readersBoxMap[readersList[i]] == "" || readersBoxMap[readersList[i]] == null) {
      if(!seenNull) {
        seenNull = true;
        valuesData.push({id:i, text:readersBoxMap[readersList[i]]});
      }
    }
    else {
      valuesData.push({id:i, text:readersBoxMap[readersList[i]]});
    }
    keysData.push({id:i, text:readersList[i]});
  }

  $('#readsViewer-readerFilter').select2({
    data:keysData
  });
  $('#readsViewer-boxFilter').select2({
    data:valuesData
  });

/*
  keysData = [];
  for(let i=0; i<fieldSitesList.length; i++) {
    keysData.push({id:fieldSitesList[i], text:fieldSitesList[i]});
  }
  */

  $('#readsViewer-fieldSiteFilter').select2({
    data:keysData
  });
}

// Load all of the analytics data
function rvLoadAnalytics() {
  // If we've gotten all the data
  if(numberOfEntries >= 0 && rfidCounts) {
    // Check to see if there is less than 10 rfids.  Show if there is and hide other wise (this just makes it easier to see)
    if(Object.keys(rfidCounts).length <= 10) {
      document.getElementById('readsViewer-analyticsBirdCheck').checked = true
      $('#readsViewer-analyticsBird').show();
      document.getElementById('readsViewer-analyticsBirdCountCheck').checked = true
      $('#readsViewer-analyticsBirdCount').show();
      document.getElementById('readsViewer-analyticsBirdChartCheck').checked = true
      $('#readsViewer-analyticsBirdChart').show();
    }
    else {
      //document.getElementById('readsViewer-analyticsBirdCheck').checked = false
      //$('#readsViewer-analyticsBird').hide();
      document.getElementById('readsViewer-analyticsBirdCountCheck').checked = false
      $('#readsViewer-analyticsBirdCount').hide();
      document.getElementById('readsViewer-analyticsBirdChartCheck').checked = false
      $('#readsViewer-analyticsBirdChart').hide();
    }

    // Check to see if there is less than 10 reader.  Show if there is and hide other wise (this just makes it easier to see)
    if(Object.keys(readerCounts).length <= 10) {
      document.getElementById('readsViewer-analyticsReaderCheck').checked = true
      $('#readsViewer-analyticsReader').show();
      document.getElementById('readsViewer-analyticsReaderCountCheck').checked = true
      $('#readsViewer-analyticsReaderCount').show();
      document.getElementById('readsViewer-analyticsReaderChartCheck').checked = true
      $('#readsViewer-analyticsReaderChart').show();
    }
    else {
      //document.getElementById('readsViewer-analyticsReaderCheck').checked = false
      //$('#readsViewer-analyticsReader').hide();
      document.getElementById('readsViewer-analyticsReaderCountCheck').checked = false
      $('#readsViewer-analyticsReaderCount').hide();
      document.getElementById('readsViewer-analyticsReaderChartCheck').checked = false
      $('#readsViewer-analyticsReaderChart').hide();
    }

    rvLoadBreakdown();
    birdCharts.newData(rfidCounts);
    birdCharts.render();
    boxCharts.newData(readerCounts);
    boxCharts.render();
  }
}

// Load the bird and box reads breakdown
function rvLoadBreakdown() {
  $('#readsViewer-analyticsBirdCountTable').empty();

  let stringToAppend = "";
  var readers = "";
  var total = 0;
  let sex = '';

  // Load bird data
  for(var c in rfidCounts) {
    total = 0;
    readers = "";

    // Calculate the total number of reads for this rfid and the readers string
    //let counter = 0;
    for(var d in rfidCounts[c]) {
      readers += '<a href="/boxes.html?reader='+d+'">'+d+'</a>, ';
      /*
      if(counter == 2 && rfidCounts[c][Object.keys(rfidCounts[c]).length] != d) {
        readers += '<br />';
        counter = 0;
      }
      counter++;
      */
      total += rfidCounts[c][d];
    }

    sex = "";
    switch(RFIDSexMap[RFIDBandMap[c]]) {
      case 'Male':
        sex = '<span style="color:blue;">&#9794;</span>';
        break;
      case 'Female':
        sex = '<span style="color:pink;">&#9792</span>';
        break;
      default:
        sex = '<span style="color:black;">?</span>';
        break;
    }

    stringToAppend = '<tr><td><a   href="/birds.html?id='+c+'">'+c+'</a></td><td><a   href="/birds.html?id='+c+'">'+RFIDBandMap[c]+'</a>'+sex+'</td><td>'+total+'</td><td>'+((total/numberOfEntries)*100).toFixed(2)+'</td><td>';
    // Add links to readers webpages
    stringToAppend += readers;
    stringToAppend = stringToAppend.substr(0, stringToAppend.length-2);
    stringToAppend += "</td></tr>";
    $('#readsViewer-analyticsBirdCountTable').append(stringToAppend);
  }

  $('#readsViewer-analyticsReaderCountTable').empty();

  // Load reader data
  for(var c in readerCounts) {
    total = 0;
    readers = "";

    // Calculate the total number of reads for this reader and the readers string
    //counter = 0;
    for(var d in readerCounts[c]) {
      readers += '<a href="/birds.html?id='+d+'">'+d+'</a>, ';
      /*
      if(counter == 2 && rfidCounts[c][Object.keys(rfidCounts[c]).length] != d) {
        readers += '<br />';
        counter = 0;
      }
      counter++;
      */
      total += readerCounts[c][d];
    }

    stringToAppend = '<tr><td><a   href="/boxes.html?reader='+c+'">'+c+'</a></td><td><a   href="/boxes.html?reader='+c+'">'+readersBoxMap[c]+'</a></td><td>'+total+'</td><td>'+((total/numberOfEntries)*100).toFixed(2)+'</td><td>';
    // Add links to readers webpages
    stringToAppend += readers;
    stringToAppend = stringToAppend.substr(0, stringToAppend.length-2);
    stringToAppend += "</td></tr>";
    $('#readsViewer-analyticsReaderCountTable').append(stringToAppend);
  }
}

// Checks to see if the data is in the filter and retruns true if that condition is met
function inSubset(data) {
  // TODO: The filters is the universe
  if(filters.rfid && filters.band && filters.box && filters.reader && filters.startDate && filters.endDate) {
    return true;
  }

  // Convert bandID to rfid for data
  for(var c in data.band) {
    if(data.rfid) {
      data.rfid.push(RFIDBandMap.c);
    }
    else {
      data.rfid = [RFIDBandMap.c];
    }
  }

  // Convert bandID to rfid for data
  let f = JSON.parse(JSON.stringify(filters));
  for(var c in f.band) {
    if(f.rfid) {
      f.rfid.push(RFIDBandMap.c);
    }
    else {
      f.rfid = [RFIDBandMap.c];
    }
  }

  // Check rfid
  for(var c in f.rfid) {
    if(!data.rfid.includes(c)) {
      return false;
    }
  }

  // Check box
  for(var c in f.box) {
    if(!data.box.includes(c)) {
      return false;
    }
  }

  // Check reader
  for(var c in f.reader) {
    if(!data.reader.includes(c)) {
      return false;
    }
  }

  // Check dates
  if(f.startDate && f.endDate) {
    if(new Date(f.startDate) <= new Date(data.startDate) && new Date(data.startDate) <= new Date(data.endDate)) {
      return true;
    }
    else {
      return false;
    }
  }

  return true;

}
