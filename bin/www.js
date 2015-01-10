var debug = require('debug')('SmoothieRocks');
var app = require(__dirname + '/../app');

app.set('port', process.env.PORT || 8000);

var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});