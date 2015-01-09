var debug = require('debug')('SmoothieRocks');
var app = require('../app');


app.set('port', process.env.PORT || 8000);
app.set('host', "smoothie.dev");

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});