var debug = require('debug')('SmoothieRocks');
var app = require(__dirname + '/../app');
var config = require("config.json");

app.set('port', config.port || 9000);

var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});