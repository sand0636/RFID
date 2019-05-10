/*
 * Ben Duggan
 * 12/2/18
 * Script for html settings page
 */

var settings = {}

socket.on('saveData-client', function(data) {
  console.log(data);
  $('#saveData-downloadZIP').text('Download ZIP: ' + data.data);
  $('#saveData-downloadZIP').parent().attr("href", "/outputCSV/" + data.data);
});

$(document).ready(function() {
  socket.emit('saveData-server', {"type":"fileName"});
  socket.emit('settings-getSystemSettings', {});

  // Get system stats every 500 ms
  setInterval(function() {
    socket.emit('settings-systemStats', {});
  }, 500);
});

// The settings found in settings.json
socket.on('settings-systemSettings', function(data) {
  console.log(data);
  settings = data;
  // System data
  $('#system-systemName').val(settings.system_name);
  if(settings.system_type == 'FieldSite') {
    $('#system-typeFieldSite').attr('class', 'btn btn-primary');
    $('#system-typeOther').attr('class', 'btn btn-secondary');
  }
  else {
    $('#system-typeFieldSite').attr('class', 'btn btn-secondary');
    $('#system-typeOther').attr('class', 'btn btn-primary');
  }
  // Wireless
  if(settings.wireless.apOn) {
    $('#wireless-apOn').attr('class', 'btn btn-primary');
    $('#wireless-apOff').attr('class', 'btn btn-secondary');
  }
  else {
    $('#wireless-apOn').attr('class', 'btn btn-secondary');
    $('#wireless-apOff').attr('class', 'btn btn-primary');
  }
  $('#wireless-ssidAP').val(data.wireless.ap.ssid);
  $('#wireless-passphraseAP').val(data.wireless.ap.passphrase);
  $('#wireless-ssidWiFi').val(data.wireless.wifi.ssid);
  $('#wireless-passphraseWiFi').val(data.wireless.wifi.passphrase);
  // Radio
  if(settings.radio.enable) {
    $('#radio-on').attr('class', 'btn btn-primary');
    $('#radio-off').attr('class', 'btn btn-secondary');
  }
  else {
    $('#radio-on').attr('class', 'btn btn-secondary');
    $('#radio-off').attr('class', 'btn btn-primary');
  }
  $('#radio-ce').val(settings.radio.ce);
  $('#radio-csn').val(settings.radio.csn);
  $('#radio-channel').val(settings.radio.channel);
  $('#radio-dataRate').val(settings.radio.data_rate);
  $('#radio-paLevel').val(settings.radio.PA_level);
});


/**
 * System Settings
 **/
 // Field site type
$('#system-typeFieldSite').click(function() {
  if(settings.system_type != 'FieldSite') {
    socket.emit('settings-save', {"system_type":true});
  }
});
$('#system-typeOther').click(function() {
  if(settings.system_type != 'other') {
    socket.emit('settings-save', {"system_type":false});
  }
});
// Field site name
$('#system-systemData').click(function() {
  socket.emit('settings-save', {'system_name':$('#system-systemName').val()});
});
// Handel system stats data
var cpuUsage = [];
socket.on('settings-systemStatsData', function(data) {
  $('#settings-systemTime').text(data['time']);
  $('#settings-systemTimeZone').text(data['timezone']);
  $('#settings-systemUpTime').text(Math.round(data['upTime']*100)/100);
  $('#settings-systemArchitecture').text(data['arch']);
  $('#settings-systemOS').text(data['os']);
  $('#settings-systemFreeMem').text(data['freeMemory'] + " bytes");
  $('#settings-systemTotalMem').text(data['totalMemory'] + " bytes");
  $('#settings-systemPercentMem').text(Math.round((data['freeMemory']/data['totalMemory'])*10000)/100 + "%");

  if(cpuUsage.length == 10) {
    cpuUsage.shift();
  }
  cpuUsage.push(data['cpuPercent']);
  let average = 0;
  for(var i=0; i<cpuUsage.length; i++) {
    average += cpuUsage[i];
  }

  $('#settings-systemCPUUsage').text(Math.round((average/cpuUsage.length)*100)/100 + "%");
});
// Reboot
$('#system-reboot').click(function() {
  socket.emit('settings-shutdownRestart', {"data":"reboot"});
});
// Shutdown
$('#system-shutdown').click(function() {
  socket.emit('settings-shutdownRestart', {"data":"shutdown"});
});


/**
 * Wireless Settings
 **/
// apOn
$('#wireless-apOn').click(function() {
  if(!settings.wireless.apOn && confirm("This requiers the system to reboot.  Are you sure you want to do this?")) {
    socket.emit('settings-save', {"apOn":true});
  }
});
// apOff
$('#wireless-apOff').click(function() {
  if(settings.wireless.apOn && confirm("This requiers the system to reboot.  Are you sure you want to do this?")) {
    socket.emit('settings-save', {"apOn":false});
  }
});
// Update AP ssid or passphrase
$('#wireless-changeAP').click(function() {
  if(confirm('Are you sure you want to change the SSID or Passphrase?')) {
    socket.emit('settings-save', {"ap":{"ssid":$('#wireless-ssidAP').val(), "passphrase":$('#wireless-passphraseAP').val()}});
  }
});
// Update WiFi ssid or passphrase
$('#wireless-changeWiFi').click(function() {
  if(confirm('Are you sure you want to change the SSID or Passphrase?')) {
    socket.emit('settings-save', {"wifi":{"ssid":$('#wireless-ssidWiFi').val(), "passphrase":$('#wireless-passphraseWiFi').val()}});
  }
});


/**
 * Radio Settings
 **/
// enable
$('#radio-on').click(function() {
  if(!settings.radio.enable && confirm("This requiers the system to reboot.  Are you sure you want to do this?")) {
    socket.emit('settings-save', {"radioEnable":true});
  }
});
// disable
$('#radio-off').click(function() {
  if(settings.radio.enable && confirm("This requiers the system to reboot.  Are you sure you want to do this?")) {
    socket.emit('settings-save', {"radioEnable":false});
  }
});
$('#radio-submit').click(function() {
  if(confirm("Are you sure you want to update the radio settings?  This requires the system to reboot.")) {
    socket.emit('settings-save', {"radio":{"ce":$('#radio-ce').val(), "csn":$('#radio-csn').val(), "channel":$('#radio-channel').val(), "dataRate":$('#radio-dataRate').val(), "paLevel":$('#radio-paLevel').val()}});
  }
});


// Database
// Add test data
$('#database-addTestDataGo').click(function() {
  // Bird data
  socket.emit('bird-newEntry', {"bandID":"ABCDEFGHIJ", "rfidTag":0123456789, "sex":"F", "age":17, "taggedDateTime":"", "taggedLocation":"STL", "comment":"sis"});
  socket.emit('bird-newEntry', {"bandID":"ABCDEFGHIJ", "rfidTag":0123456789, "sex":"F", "age":17, "taggedDateTime":"", "taggedLocation":"STL", "comment":"sis"});
  socket.emit('bird-newEntry', {"bandID":"ABCDEFGHIJ", "rfidTag":0123456789, "sex":"F", "age":17, "taggedDateTime":"", "taggedLocation":"STL", "comment":"sis"});
  socket.emit('bird-newEntry', {"bandID":"ABCDEFGHIJ", "rfidTag":0123456789, "sex":"F", "age":17, "taggedDateTime":"", "taggedLocation":"STL", "comment":"sis"});
});

// Delete bird table
$('#database-deleteBirdTable').click(function() {
  if(confirm('YOU ARE ABOUT TO ALL DATA ABOUT BIRDS!!! Are you sure you want to do this?')) {
    window.location = "/secure/settings.html?delete=birds";
  }
});
// Delete box table
$('#database-deleteBoxTable').click(function() {
  if(confirm('YOU ARE ABOUT TO ALL DATA ABOUT BOXES!!! Are you sure you want to do this?') ) {
    window.location = "/secure/settings.html?delete=reader";
  }
});
// Delete rfidmod table
$('#database-deleteReadsTable').click(function() {
  if(confirm('YOU ARE ABOUT TO ALL DATA ABOUT READS!!! Are you sure you want to do this?')) {
    window.location = "/secure/settings.html?delete=readerdata";
  }
});
// Delete all tables
$('#database-deleteAllTable').click(function() {
  if(confirm('YOU ARE ABOUT TO ALL DATA ABOUT BIRDS, BOXES AND READS!!! Are you sure you want to do this?')) {
    window.location = "/secure/settings.html?delete=all";
  }
});
