/**
 * Created by marekbejda on 1/1/15.
 */

var exec = require('child_process').exec;
var winston = require('winston');

var subDomains = ["alpha","beta","charlie","one","two","three","four"];

var log = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: __dirname + "/../logs/dockers.log", level:'info', timestamp:true, json:true })
    ]
});

exports.getSub = function(){
    return subDomains[Math.floor(Math.random()*subDomains.length)];
}


exports.startDockfile = function(vhost, dockfile,env1, _call){
    console.log("startDockfile: " , vhost, dockfile );

    var exec_string = "make start_dockfile VHOST=$VHOST DOCKFILE=$DOCKFILE OPTS=$ENV";
    exec_string=exec_string.replace("$VHOST", vhost);
    exec_string=exec_string.replace("$DOCKFILE", dockfile);
    exec_string=exec_string.replace("$ENV", env1);

    console.log("EXEC_STRING: "  + exec_string);

    function stream(err1,err2,stdout){
        log.info([exec_string,err1,err2,stdout]);
        _call(err1,err2,stdout);
    }

    var child = exec(exec_string, stream);

    return child;
}

exports.stopDockfile = function(_id, _call){

    console.log("stopDockfile: " + _id);

    var child = exec("make stop_dockfile _ID="+_id, function(err,stdout,stderr){
        console.log("stdout2: " + stdout);
        if(err!=null){
            console.log("Error2: " + err);
        }
        _call();
    });
    return child;

}


exports.status = function(){
    console.log("api.status");

    var child = exec("$(boot2docker shellinit); make status", function(err,stdout,stderr){
        console.log("stdout Status: " + stdout);
        console.log("stderr Status: " + stderr);
        if(err!=null){
            console.log("Error Status: " + err);
        }
    });

    return child;
}

exports.startNginxProxy = function(){
    //docker run -d -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock -t jwilder/nginx-proxy
    console.log("startNginxProxy: " + vhost);

    var child = exec("$(boot2docker shellinit); make start_proxy", function(err,stdout,stderr){
        console.log("stdout2: " + stdout);
        console.log("stderr2: " + stderr);
        if(err!=null){
            console.log("Error2: " + err);
        }
    });

}

exports.stopNginxProxy = function(){
    var child = exec("$(boot2docker shellinit); make stop_proxy", function(err,stdout,stderr){
        console.log("stdout2: " + stdout);
        console.log("stderr2: " + stderr);
        if(err!=null){
            console.log("Error2: " + err);
        }
    });
}
