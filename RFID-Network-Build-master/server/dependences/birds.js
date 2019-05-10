// Ben Duggan 115/18

var updateAll = true;

$('document').ready(function(){
    if(window.location.href.split('?id=')[1]) {
        // If the url has an id in it
        loadBird(window.location.href.split('?id=')[1]);
    }
    else {
      // Load all birds
      loadAll();
    }
});

// Look at one bird
function loadBird(id) {
    updateAll = false;
    $('#sectionTitle').text(id);

    history.pushState(null, null, '?id='+id);

    // Change the button to 'Add/Edit/Delete/Show All'
    $('#birdAddEdit').html('<div class="row"><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="birdEdit(\''+id+'\');">Edit/delete</button></div><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="loadAll();">View all</button></div></div>');

    // Load id
    socket.emit('bird-getDBRow', {id:id});
    socket.emit('bird-lastLocation', {});

    // Load reads
    rvSetFilter({rfid:[id]});
    rvLoad();
}

function loadAll() {
    $('#sectionTitle').text('All birds');
    updateAll = true;

    history.pushState(null, null, window.location.pathname);

    // Change the button to 'Add/Edit/Delete/Show All'
    $('#birdAddEdit').html('<div class="row"><button type="button" class="btn btn-primary" id="birdAdd" onclick="birdAdd()">Add new bird</button></div>');

    // Request table
    socket.emit('bird-getDBRow', {});
    socket.emit('bird-lastLocation', {});

    rvHide();
}

//Event listener for when adding a new bird button is pressed and loads form.
function birdAdd() {
  $('#formContainer').show();
  $('#form-title').text("Add bird");
  $('#form-buttons').html('<div class="container"><div class="row"><div class="col-4"><button type="button" class="btn btn-success" id="form-birdAdd" onclick="formbirdAdd();">Add</button></div><div class="col-4"><center><button type="submit" class="btn btn-primary" id="form-birdClose" onclick="document.getElementById(\'formContainer\').style.display =\'none\';">Close</button></center></div>');

  // Clear the form and set the date and time field to the current date and time, respectively
  var dt = new Date();
  document.getElementById('form-rfidTag').value = "";
  document.getElementById('form-age').value = "";
  document.getElementById('form-taggedDate').value = dt.getFullYear() + '-' + ('0' + (dt.getMonth()+1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
  document.getElementById('form-taggedTime').value = ('0' + dt.getHours()).slice(-2) + ":" + ('0' + dt.getMinutes()).slice(-2) + ":" + ('0' + dt.getSeconds()).slice(-2);
  document.getElementById('form-taggedLocation').value = "";
  document.getElementById('form-comment').value = "";
}

//Edits the requested bird
function birdEdit(id) {
    $('#formContainer').show();
    $('#form-title').html("Edit birds");
    $('#form-buttons').html('<div class="container"><div class="row"><div class="col-4"><button type="button" class="btn btn-success" id="form-birdAdd" onclick="formbirdEdit();">Edit</button></div><div class="col-4"><center><button type="submit" class="btn btn-primary" id="form-birdClose" onclick="document.getElementById(\'formContainer\').style.display =\'none\';">Close</button></center></div><div class="col-4"><button type="submit" class="btn btn-danger float-right" id="form-birdDelete" onclick="formbirdDelete();">Delete</button></div></div></div>');

    // Load the row into the edit form
    document.getElementById('form-bandID').value = $('#'+id).children('.band-id').text();
    document.getElementById('form-rfidTag').value = id;
    $('#form-sex').val($('#'+id).children('.sex').text());
    document.getElementById('form-age').value = $('#'+id).children('.age').text();
    document.getElementById('form-taggedDate').value = $('#'+id).children('.date-time').children('.date').text();
    document.getElementById('form-taggedTime').value = $('#'+id).children('.date-time').children('.time').text();
    document.getElementById('form-taggedLocation').value = $('#'+id).children('.tagged-location').text();
    document.getElementById('form-comment').value = $('#'+id).children('.comment').text();
}

// Add bird
function formbirdAdd() {
    // The JSON object that holds the from data.  Formated {id, nickName, sex, age, taggedDate, taggedTime, taggedLocation, comment}
    var dataToSend = {"bandID":$('#form-bandID').val(), "rfidTag":$('#form-rfidTag').val(), "sex":$('#form-sex').val(), "age":$('#form-age').val(), "taggedDateTime":($('#form-taggedDate').val()+" "+$('#form-taggedTime').val()), "taggedLocation":$('#form-taggedLocation').val(), "comment":$('#form-comment').val()};
    console.log(dataToSend);
    socket.emit('bird-newEntry', dataToSend);
}

// Edit bird when edit a bird button is pressed and saves to the database
function formbirdEdit() {
    // The JSON object that holds the from data.  Formated {id, nickName, sex, age, taggedDate, taggedTime, taggedLocation, comment}
    var dataToSend = {"bandID":$('#form-bandID').val(), "rfidTag":$('#form-rfidTag').val(), "sex":$('#form-sex').val(), "age":$('#form-age').val(), "taggedDateTime":$('#form-taggedDate').val()+" "+$('#form-taggedTime').val(), "taggedLocation":$('#form-taggedLocation').val(), "comment":$('#form-comment').val(), "originalRFIDTag":$('#sectionTitle').text()};
    console.log(dataToSend);

    // Ask the user if they are sure
    if(confirm('Are you sure you want to edit this entry?')) {
        $('#birdTableBody').empty();
        $('#sectionTitle').text($('#form-rfidTag').val());
        socket.emit('bird-editEntry', dataToSend);
    }
}

// Delete bird when edit a bird button is pressed and saves to the database
function formbirdDelete() {
    // The JSON object that holds the from data.  Formated {id, nickName, sex, age, taggedDate, taggedTime, taggedLocation, comment}
    var dataToSend = {"rfid":$('#form-rfidTag').val()};

    console.log(dataToSend);

    // Ask the user if they are sure
    if(confirm('Are you sure you want to delete this entry?')) {
        socket.emit('bird-deleteEntry', dataToSend);
    }
}

/*
 * Socket.io on data
 */
// Insert database table into webtable
socket.on('bird-dbRow', function(data){
    var d = data.content;
    $('#birdTableBody').html('');
    for(var i=d.length-1; i>-1; i--) {
        $('#birdTableBody').append('<tr id="'+d[i].rfidTag+'" onclick="loadBird(\''+d[i].rfidTag+'\');"><td class="band-id">'+d[i].bandID+'</td><td class="rfid-tag">'+d[i].rfidTag+'</td><td class="lastPosition"></td><td class="sex">'+d[i].sex+'</td><td class="age">'+d[i].age+'</td><td class="date-time"><scan class="date">'+new Date(d[i].taggedDateTime).toSQLString().substr(0,10)+'</scan> at <span class="time">'+new Date(d[i].taggedDateTime).toSQLString().substr(11)+'</span></td><td class="tagged-location">'+d[i].taggedLocation+'</td><td class="comment">'+d[i].comment+'</td></tr>');
    }
});

// Result of adding new entry
socket.on('bird-entryResponce', function(data) {
  console.log(data);
   if(data.success) {
        // Successfully inserted
       var dataToSend = data.content;
        $('.config-formError').remove();
        $('#birdTableBody').prepend('<tr id="'+dataToSend.rfidTag+'" onclick="loadBird(\''+dataToSend.rfidTag+'\');"><td class="band-id">'+dataToSend.bandID+' </td><td class="rfid-tag">'+dataToSend.rfidTag+'</td><td class="lastPosition"></td><td class="sex">'+dataToSend.sex+'</td><td class="age">'+dataToSend.age+'</td><td class="date-time"><scan class="date">'+dataToSend.taggedDateTime.substr(0,10)+'</scan> at <span class="time">'+dataToSend.taggedDateTime.substr(11)+'</span></td><td class="tagged-location">'+dataToSend.taggedLocation+'</td><td class="comment">'+dataToSend.comment+'</td></tr>');
        $('#formContainer').hide();
   }
    else {
        // Error occured
        $('.message').prepend('<div class="alert alert-danger alert-dismissable config-formError"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>    <strong>Error: </strong> An error occured: '+ data.message+'.<div>');
        console.log("Error: " + data.message);
    }
});

// Result of editing an entry
socket.on('bird-editResponce', function(data) {
  console.log(data);

   if(data.success) {
       var dataToSend = data.content;

       var d = new Date(dataToSend.taggedDateTime).toSQLString();

        // Successfully inserted
        $('.config-formError').remove();
        $('#'+dataToSend.rfidTag).remove(); //Remove old entry
        $('#currentElementId').text(dataToSend.rfidTag);
        $('#currentElementEdit').html('<button type="button" class="btn btn-primary" onclick="birdEdit(\''+dataToSend.rfidTag+'\');">Edit/delete</button>');
        $('#birdTableBody').prepend('<tr id="edit-'+dataToSend.rfidTag+'"><td class="band-id">'+dataToSend.bandID+' </td><td class="rfid-tag">'+dataToSend.rfidTag+'</td><td class="lastPosition"></td><td class="sex">'+dataToSend.sex+'</td><td class="age">'+dataToSend.age+'</td><td class="date-time"><scan class="date">'+d.substr(0,10)+'</scan> at <span class="time">'+d.substr(11)+'</span></td><td class="tagged-location">'+dataToSend.taggedLocation+'</td><td class="comment">'+dataToSend.comment+'</td></tr>');
        $('#formContainer').hide();
        $('#birdAddEdit').html('<div class="row"><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="birdEdit(\''+dataToSend.rfidTag+'\');">Edit/delete</button></div><div class="col-md-6"><button type="button" class="btn btn-primary" onclick="loadAll();">View all</button></div></div>');
   }
    else {
        // Error occured
        $('.message').prepend('<div class="alert alert-danger alert-dismissable config-formError"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>    <strong>Error: </strong> An error occured: '+ data.message+'.<div>');
        console.log("Error: " + data.message);
    }
});

// Result of deleting an entry
socket.on('bird-deleteResponce', function(data) {
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

// Results of last location
socket.on('bird-lastLocationResponse', function(data) {
  $('#'+data.data[0].rfid).children('.lastPosition').html('<a href="/boxes.html?reader=' + data.data[0].reader + '">' + data.data[0].reader + '</a>');
});

// Update the last position when there is a new read
socket.on('newRead', function(data) {
  $('#'+data.rfid).children('.lastPosition').html('<a href="/boxes.html?reader=' + data.reader + '">' + data.reader + '</a>');
});
