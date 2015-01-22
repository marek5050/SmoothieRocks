/**
 * Created by marekbejda on 1/1/15.
 */

var winston = require('winston');
var config = require(__dirname + "/config.json");
var redis = require("redis"),
    client = redis.createClient(config.redis.PORT, config.redis.HOST, {auth_pass: config.redis.PASS});

var HOST = config.HOST;

client.on("error", function (err) {
    console.log("Error " + err);
});

redis.debug_mode = false;

client.on("connect", function (err) {
    //client.set("foo_rand000000000000", "some fantastic value");
});

var log = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)()
        //,new (winston.transports.File)({ filename: __dirname + "/../logs/dockers.log", level:'info', timestamp:true, json:true })
    ]
});

function replaceAll(find, replace, str) {
    var find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return str.replace(new RegExp(find, 'g'), replace);
}

/*
 Accepts a record
 {
 d_id:
 subdomain:
 domain:
 ipaddress:
 port:
 }
 */

//redis-cli rpush frontend:www.dotcloud.com http://192.168.0.42:80

exports.commitRecord = function (service) {

    //console.log("We are commiting ", service);
    var inspect = (JSON.parse(service.inspect))[0];
    //console.log(inspect.NetworkSettings.IPAddress+":"+inspect.Config.ExposedPorts.keys[0]);
    var keys = (Object.keys(inspect.Config.ExposedPorts));
    if (keys.indexOf("80/tcp") != -1) {
        port = 80;
    } else if (keys.indexOf("8080/tcp") != -1) {
        port = 8080;
    } else {
        port = (keys[0]).split("/")[0];
    }

    client.del("frontend:" + service.subdomain + "." + HOST);
    client.rpush(["frontend:" + service.subdomain + "." + HOST, service.docker_id], redis.print);
    client.rpush(["frontend:" + service.subdomain, "http://" + inspect.NetworkSettings.IPAddress + ":" + port], redis.print);

    if (service.domain && service.domain.indexOf(" ") == -1) {
        console.log("domain ", ["frontend:" + service.domain, "http://" + inspect.NetworkSettings.IPAddress + ":" + port]);
        client.del("frontend:" + service.domain + "." + HOST);
        client.rpush(["frontend:" + service.domain, "http://" + inspect.NetworkSettings.IPAddress + ":" + port], redis.print);
    }

    //client.lrange(["frontend:" + service.subdomain + "." + HOST, 0, -1], redis.print);

};

//var dockerfile = {
//    d_id:"Snogger",
//    subdomain: "a.smoothie.dev",
//    domain: "aster",
//    ipaddress:"172.17.0.5",
//    port:"2368"
//}
//
//exports.commitRecord(dockerfile)
