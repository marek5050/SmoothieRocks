var debug = require('debug')('SmoothieRocks');
var app = require(__dirname + '/../app');
var config = require(__dirname + "/config.json");


var server = app.listen(config.PORT, function () {

    debug('Express server listening on port ' + server.address().port);

});