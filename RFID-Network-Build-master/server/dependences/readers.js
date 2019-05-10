/*
 * Ben Duggan
 * 10/30/18
 * Script for handeling box page
 */

var updateAll = true;
//let fieldSitesList = []; //Contains all fieldSites

$('document').ready(function(){
    if(window.location.href.split('?reader=')[1]) {
        // If the url has an id in it
        loadbox(window.location.href.split('?reader=')[1]);
    }
    else {
      // Load all boxes
      loadAll();
    }
});

// Look at one box
function loadbox(reader) {
    $('.tableMore').show();
    updateAll = false;
    $('#sectionTitle').text(reader);

    history.pushState(null, null, '?reader='+reader);

    // Change the button to 'Add/Edit/Delete/Show All'
    $('#boxAddEdit').html('<div class="row"><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="boxEdit(\''+reader+'\');">Edit/delete</button></div><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="loadAll();">View all</button></div></div><br /><div class="row"><div class="col-md-12"><button type="button" class="btn btn-primary" onclick="batteryChanged(\''+reader+'\');">Changed battery</button></div></div>');

    // Load id
    socket.emit('box-getDBRow', {reader:reader});
    socket.emit('box-lastBird', {});

    rvSetFilter({reader:[reader]});
    rvLoad();
}

function loadAll() {
    $('.tableMore').css('display', 'none');
    $('#formContainer').hide();
    $('#sectionTitle').text('All boxes');
    updateAll = true;

    history.pushState(null, null, window.location.pathname);

    // Change the button to 'Add/Edit/Delete/Show All'
    $('#boxAddEdit').html('<div class="row"><button type="button" class="btn btn-primary" id="boxAdd" onclick="boxAdd()">Add new box</button></div>');

    // Request table
    socket.emit('box-getDBRow', {});
    socket.emit('box-lastBird', {});

    rvHide();
}

//Event listener for when adding a new box button is pressed and loads form.
function boxAdd() {
  $('#formContainer').show();
  $('#form-title').text("Add box");
  $('#form-buttons').html('<div class="container"><div class="row"><div class="col-4"><button type="button" class="btn btn-success" id="form-boxAdd" onclick="formboxAdd();">Add</button></div><div class="col-4"><center><button type="submit" class="btn btn-primary" id="form-boxClose" onclick="document.getElementById(\'formContainer\').style.display =\'none\';">Close</button></center></div>');

  // Clear the form and set the date and time field to the current date and time, respectively
  var dt = new Date();
  document.getElementById('form-reader').value = "";
  document.getElementById('form-box').value = "";
  $('#form-fieldSite').val('NULL').trigger('change');
  document.getElementById('form-lat').value = "";
  document.getElementById('form-lon').value = "";
  document.getElementById('form-taggedDate').value = dt.getFullYear() + '-' + ('0' + (dt.getMonth()+1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  document.getElementById('form-taggedTime').value = ('0' + dt.getHours()).slice(-2) + ":" + ('0' + dt.getMinutes()).slice(-2) + ":" + ('0' + dt.getSeconds()).slice(-2);
  document.getElementById('form-comment').value = "";
  document.getElementById('form-currentDraw').value = "";
  document.getElementById('form-currentSupply').value = "";
}

//Edits the requested box
function boxEdit(id) {
    $('#formContainer').show();
    $('#form-title').html("Edit boxes");
    $('#form-buttons').html('<div class="container"><div class="row"><div class="col-4"><button type="button" class="btn btn-success" id="form-boxAdd" onclick="formboxEdit();">Edit</button></div><div class="col-4"><center><button type="submit" class="btn btn-primary" id="form-boxClose" onclick="document.getElementById(\'formContainer\').style.display =\'none\';">Close</button></center></div><div class="col-4"><button type="submit" class="btn btn-danger float-right" id="form-boxDelete" onclick="formboxDelete();">Delete</button></div></div></div>');

    // Load the row into the edit form
    document.getElementById('form-reader').value = id;
    document.getElementById('form-box').value = $('#'+id).children('.box').text();
    $('#form-fieldSite').val($('#'+id).children('.fieldSite').text()).trigger('change');
    //document.getElementById('form-fieldSite').value = $('#'+id).children('.fieldSite').text();
    document.getElementById('form-lat').value = $('#'+id).children('.lat').text();
    document.getElementById('form-lon').value = $('#'+id).children('.lon').text();
    document.getElementById('form-taggedDate').value = $('#'+id).children('.date-time').children('.date').text();
    document.getElementById('form-taggedTime').value = $('#'+id).children('.date-time').children('.time').text();
    document.getElementById('form-comment').value = $('#'+id).children('.comment').text();
    document.getElementById('form-currentDraw').value = $('#'+id).children('.currentDraw').text();
    document.getElementById('form-currentSupply').value = $('#'+id).children('.currentSupply').text();
}

// Add box
function formboxAdd() {
    // The JSON object that holds the from data.  Formated {id, nickName, sex, age, taggedDate, taggedTime, taggedLocation, comment}
    var dataToSend = {"reader":$('#form-reader').val(), "box":$('#form-box').val(), "fieldSite":$('#form-fieldSite').val(), "lat":$('#form-lat').val(), "lon":$('#form-lon').val(), "taggedDateTime":($('#form-taggedDate').val()+" "+$('#form-taggedTime').val()), "comment":$('#form-comment').val(), "currentDraw":$('#form-currentDraw').val(), "currentSupply":$('#form-currentSupply').val(), "originalReader":$('#sectionTitle').text()};
    console.log(dataToSend);
    socket.emit('box-newEntry', dataToSend);
}

// Edit box when edit a box button is pressed and saves to the database
function formboxEdit() {
    // The JSON object that holds the from data.  Formated {id, nickName, sex, age, taggedDate, taggedTime, taggedLocation, comment}
    var dataToSend = {"reader":$('#form-reader').val(), "box":$('#form-box').val(), "fieldSite":$('#form-fieldSite').val(), "lat":$('#form-lat').val(), "lon":$('#form-lon').val(), "taggedDateTime":($('#form-taggedDate').val()+" "+$('#form-taggedTime').val()), "comment":$('#form-comment').val(), "currentDraw":$('#form-currentDraw').val(), "currentSupply":$('#form-currentSupply').val(), "originalReader":$('#sectionTitle').text()};
    console.log(dataToSend);

    // Ask the user if they are sure
    if(confirm('Are you sure you want to edit this entry?')) {
        socket.emit('box-editEntry', dataToSend);
    }
}

// Delete box when edit a box button is pressed and saves to the database
function formboxDelete() {
    // The JSON object that holds the from data.
    var dataToSend = {"reader":$('#form-reader').val()};

    console.log(dataToSend);

    // Ask the user if they are sure
    if(confirm('Are you sure you want to delete this entry?')) {
        socket.emit('box-deleteEntry', dataToSend);
    }
}

// Method to reset the time when a battery for a given reader was Changed
function batteryChanged(id) {
  var dataToSend = {"reader":id, "box":$('#'+id).children('.box').text(), "fieldSite":$('#'+id).children('.fieldSite').text(), "lat":$('#'+id).children('.lat').text(), "lon":$('#'+id).children('.lon').text(), "taggedDateTime":(new Date()).toSQLString(), "comment":$('#'+id).children('.comment').text(), "currentDraw":$('#'+id).children('.currentDraw').text(), "currentSupply":$('#'+id).children('.currentSupply').text(), "originalReader":id};
  console.log(dataToSend);

  socket.emit('box-editEntry', dataToSend);

}

/*
 * Socket.io on data
 */
// Insert database table into webtable
socket.on('box-dbRow', function(data){
    console.log(data.content);
    var d = data.content;
    $('#boxTableBody').html('');
    for(var i=d.length-1; i>-1; i--) {
      var trColor = "<tr ";
      let estTimeOn = (d[i].currentSupply * 3600) / d[i].currentDraw;
      let timeOnLeft = Math.round((new Date(d[i].taggedDateTime).getTime()/1000 + estTimeOn) - (new Date()).getTime()/1000);
      if(d[i].currentSupply > 0) {
        if((timeOnLeft/estTimeOn)*100 >= 50) {
          trColor += 'class="table-success" ';
        }
        else if((timeOnLeft/estTimeOn)*100 >= 25) {
          trColor += 'class="table-warning" ';
        }
        else if((timeOnLeft/estTimeOn)*100 >= 10) {
          trColor += 'class="table-info" ';
        }
        else {
          trColor += 'class="table-danger" ';
        }
      }
      $('#boxTableBody').append(trColor + 'id="'+d[i].reader+'" onclick="loadbox(\''+d[i].reader+'\');"><td class="box">'+d[i].box+'</td><td class="reader">'+d[i].reader+'</td><td class="lastBirds"></td><td class="fieldSite tableMore">'+d[i].fieldSite+'</td><td class="lat tableMore">'+d[i].lat+'</td><td class="lon tableMore">'+d[i].lon+'</td><td class="date-time"><scan class="date">'+new Date(d[i].taggedDateTime).toSQLString().substr(0,10)+'</scan> at <span class="time">'+new Date(d[i].taggedDateTime).toSQLString().substr(11)+'</span></td><td class="currentDraw tableMore">'+d[i].currentDraw+'</td><td class="currentSupply tableMore">'+d[i].currentSupply+'</td><td class="timeOn">'+Math.round(timeOnLeft/60)+'</td><td class="comment">'+d[i].comment+'</td></tr>');
    }
    if(d.length > 1) {
        $('.tableMore').css('display', 'none');
    }
});

// Result of adding new entry
socket.on('box-entryResponce', function(data) {
   if(data.success) {
        // Successfully inserted
       var dataToSend = data.content;
       var trColor = "<tr ";
       let estTimeOn = (dataToSend.currentSupply * 3600) / dataToSend.currentDraw;
       let timeOnLeft = Math.round((new Date(d[i].taggedDateTime).getTime()/1000 + estTimeOn) - (new Date()).getTime()/1000);
       if(dataToSend.currentSupply > 0) {
         if((timeOnLeft/estTimeOn)*100 >= 50) {
           trColor += 'class="table-success" ';
         }
         else if((timeOnLeft/estTimeOn)*100 >= 25) {
           trColor += 'class="table-warning" ';
         }
         else if((timeOnLeft/estTimeOn)*100 >= 10) {
           trColor += 'class="table-info" ';
         }
         else {
           trColor += 'class="table-danger" ';
         }
       }
        $('.config-formError').remove();
        $('#boxTableBody').prepend(trColor + 'id="'+dataToSend.reader+'" onclick="loadbox(\''+dataToSend.reader+'\');"><td class="box">'+dataToSend.box+'</td><td class="reader">'+dataToSend.reader+'</td><td class="lastBirds"></td><td class="fieldSite tableMore">'+dataToSend.fieldSite+'</td><td class="lat tableMore">'+dataToSend.lat+'</td><td class="lon tableMore">'+dataToSend.lon+'</td><td class="date-time"><scan class="date">'+new Date(dataToSend.taggedDateTime).toSQLString().substr(0,10)+'</scan> at <span class="time">'+new Date(dataToSend.taggedDateTime).toSQLString().substr(11)+'</span></td><td class="currentDraw tableMore">'+dataToSend.currentDraw+'</td><td class="currentSupply tableMore">'+dataToSend.currentSupply+'</td><td class="timeOn">'+Math.round(timeOnLeft/60)+'</td><td class="comment">'+dataToSend.comment+'</td></tr>');
        $('#formContainer').hide();
   }
    else {
        // Error occured
        $('.message').prepend('<div class="alert alert-danger alert-dismissable config-formError"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>    <strong>Error: </strong> An error occured: '+ data.message+'.<div>');
        console.log("Error: " + data.message);
    }
});

// Result of editing an entry
socket.on('box-editResponce', function(data) {
  console.log(data);

   if(data.success) {
       var dataToSend = data.content;

       var d = new Date(dataToSend.taggedDateTime).toSQLString();

       var trColor = "<tr ";
       let estTimeOn = (dataToSend.currentSupply * 3600) / dataToSend.currentDraw;
       let timeOnLeft = Math.round((new Date(dataToSend.taggedDateTime).getTime()/1000 + estTimeOn) - (new Date()).getTime()/1000);
       if(dataToSend.currentSupply > 0) {
         if((timeOnLeft/estTimeOn)*100 >= 50) {
           trColor += 'class="table-success" ';
         }
         else if((timeOnLeft/estTimeOn)*100 >= 25) {
           trColor += 'class="table-warning" ';
         }
         else if((timeOnLeft/estTimeOn)*100 >= 10) {
           trColor += 'class="table-info" ';
         }
         else {
           trColor += 'class="table-danger" ';
         }
       }
        // Successfully inserted
        $('.config-formError').remove();
        $('#'+dataToSend.reader).remove(); //Remove old entry
        $('#currentElementId').text(dataToSend.rfidTag);
        $('#currentElementEdit').html('<button type="button" class="btn btn-primary" onclick="boxEdit(\''+dataToSend.reader+'\');">Edit/delete</button>');
        $('#boxTableBody').prepend(trColor + 'id="'+dataToSend.reader+'" onclick="loadbox(\''+dataToSend.reader+'\');"><td class="box">'+dataToSend.box+'</td><td class="reader">'+dataToSend.reader+'</td><td class="lastBirds"></td><td class="fieldSite tableMore">'+dataToSend.fieldSite+'</td><td class="lat tableMore">'+dataToSend.lat+'</td><td class="lon tableMore">'+dataToSend.lon+'</td><td class="date-time"><scan class="date">'+new Date(dataToSend.taggedDateTime).toSQLString().substr(0,10)+'</scan> at <span class="time">'+new Date(dataToSend.taggedDateTime).toSQLString().substr(11)+'</span></td><td class="currentDraw tableMore">'+dataToSend.currentDraw+'</td><td class="currentSupply tableMore">'+dataToSend.currentSupply+'</td><td class="timeOn">'+Math.round(timeOnLeft/60)+'</td><td class="comment">'+dataToSend.comment+'</td></tr>');
        $('#formContainer').hide();
        $('#boxAddEdit').html('<div class="row"><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="boxEdit(\''+dataToSend.reader+'\');">Edit/delete</button></div><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="loadAll();">View all</button></div></div><br /><div class="row"><div class="col-md-12"><button type="button" class="btn btn-primary" onclick="batteryChanged(\''+reader+'\');">Changed battery</button></div></div>');
   }
    else {
        // Error occured
        $('.message').prepend('<div class="alert alert-danger alert-dismissable config-formError"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>    <strong>Error: </strong> An error occured: '+ data.message+'.<div>');
        console.log("Error: " + data.message);
    }
});

// Result of deleting an entry
socket.on('box-deleteResponce', function(data) {
   if(data.success) {
     console.log('hi');
        // Successfully inserted
        $('.config-formError').remove();
        $('#formContainer').hide();
        loadAll();
   }
    else {
        // Error occured
        $('.message').prepend('<div class="alert alert-danger alert-dismissable config-formError"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>    <strong>Error: </strong> An error occured: '+ data.message+'.<div>');
        console.log("Error: " + data.message);
    }
});

// Results of last bird
socket.on('box-lastBirdResponse', function(data) {
  $('#'+data.data[0].reader).children('.lastBirds').html('<a href="/birds.html?id=' + data.data[0].rfid + '">' + data.data[0].rfid + '</a>');
});

// Update the last position when there is a new read
socket.on('newRead', function(data) {
  $('#'+data.reader).children('.lastBirds').html('<a href="/birds.html?id=' + data.rfid + '">' + data.rfid + '</a>');
});

// Got the current systemsVariables
// Adds the field sites to the select2 dropdown
socket.on('systemsVariables', function(data) {
  console.log(data);
  let keysData = [];
  for(let i=0; i<fieldSitesList.length; i++) {
    keysData.push({id:fieldSitesList[i], text:fieldSitesList[i]});
  }

  $('#form-fieldSite').select2({
    data:keysData
  });
});
