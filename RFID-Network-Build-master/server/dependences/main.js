/*
 * Ben Duggan
 * 12/14/18
 * Reusable javascript code used by most pages
 */

 var socket = io();
 var wasDisconnected = false;

// Fixes the problem of ISO style with timezone offset
// Solution from - https://stackoverflow.com/questions/17415579/how-to-iso-8601-format-a-date-with-timezone-offset-in-javascript
Date.prototype.toSQLString = function() {
    var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        ' ' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds());
}

socket.on('connect', function(data) {
  if(wasDisconnected) {
    $('#error-connection').remove();
    $('#errorsContainer').prepend('<div class="alert alert-success alert-dismissible fade show" id="error-connection" role="alert"><strong>Connected to the server. </strong><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
    wasDisconnected = false;
  }
});

socket.on('disconnect', function(data) {
  console.log(data);
  $('#error-connection').remove();
  $('#errorsContainer').prepend('<div class="alert alert-danger alert-dismissible fade show" id="error-connection" role="alert"><strong>Disconnected from the server. </strong>The server might have crashed.  This means that no data is being saved.  Try refreshing and if nothing appears, restart the server.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
  wasDisconnected = true;
});

socket.on('errorMessage', function(data) {
  console.error(data);

  var err = '';
  for(var c in data) {
    err += "{<i>" + c + "</i>: " + data[c] + "} ";
  }

  $('#errorsContainer').prepend('<div class="alert alert-danger alert-dismissible fade show" role="alert"><strong>An error occured on the server: </strong>'+err+'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>');
});
