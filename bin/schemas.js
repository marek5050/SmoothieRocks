var mongoose = require('mongoose'),
    findOrCreate = require('mongoose-findorcreate'),
    Schema = mongoose.Schema;

var UATokensSchema = new Schema({
    service: String,
    email : String,
    access : String,
    refresh: String,
    date: {type: Date}
});


var dockerFileSchema = new Schema({
    docker_id: String,
    subdomain: String,
    domain: String,
    service: String,
    opts: [Schema.Types.Mixed],
    status: String,
    commited: {type: Boolean, default: false},
    inspect: Schema.Types.Mixed
});

var UserSchema = new Schema({
    email: String
    ,dockerFiles:[]
});

UserSchema.plugin(findOrCreate);


module.exports.uatokens = mongoose.model("uatokens", UATokensSchema);
module.exports.user = mongoose.model( "useraccounts", UserSchema);
module.exports.dockerfile = mongoose.model( "dockerFile", dockerFileSchema);
