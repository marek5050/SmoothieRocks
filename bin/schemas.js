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
    _id: String,
    subdomain: String,
    service: String,
    opts: String
});

var UserSchema = new Schema({
    email: String
    ,dockerFiles:[]
});

UserSchema.plugin(findOrCreate);


module.exports.uatokens = mongoose.model("uatokens", UATokensSchema);
module.exports.user = mongoose.model( "useraccounts", UserSchema);
module.exports.dockerfile = mongoose.model( "dockerFile", dockerFileSchema);
