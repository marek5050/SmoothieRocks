/**
 * Created by marekbejda on 1/1/15.
 */

var exec = require('child_process').exec;
var winston = require('winston');

var subDomains = ["alpha","beta","charlie","one","two","three","four"];

var log = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: __dirname + "/../logs/dockers.log", level:'info', timestamp:true, json:true })
    ]
});

var HOST = process.env.HOST || "smoothie.dev";

function replaceAll(find, replace, str) {
    var find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return str.replace(new RegExp(find, 'g'), replace);
}

exports.getSub = function(){
    return subDomains[Math.floor(Math.random()*subDomains.length)];
};

exports.commit = function (_id, mongo_id, _call) {
    console.log("dockie.commit: ", _id);

    var exec_string = "docker commit $(_ID) $(MONGO_ID)";
    exec_string = exec_string.replace("$(_ID)", _id);
    exec_string = exec_string.replace("$(MONGO_ID)", mongo_id);

    function stream(err1, err2, stdout) {
        console.log(exec_string, err1, err2, stdout);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};


function wordpressBuild(docker) {

    var vhost = docker.subdomain + "." + HOST;
    if (docker.domain)
        vhost = vhost + "," + docker.domain;


    var service = docker.service;
    if (docker.commited) {
        service = docker._id;
    }


    var tmpl = "docker run  -d -e \"VIRTUAL_HOST=$(VHOST)\" -e \"SITEURL=$(SUBDOMAIN)\" -e \"PLUGINS=$(PLUGINS)\" -t $(DOCKFILE)";
    tmpl = tmpl.replace("$(VHOST)", vhost);
    tmpl = tmpl.replace("$(SUBDOMAIN)", docker.subdomain + "." + HOST);
    tmpl = tmpl.replace("$(PLUGINS)", docker.opts.join(";"));
    tmpl = tmpl.replace("$(DOCKFILE)", service);

    return tmpl;
}


exports.run = function (docker, _call) {
    console.log("dockie.run: ", docker);

    var exec_string = "";
    if (docker.service.indexOf("wordpress") != -1) {
        exec_string = wordpressBuild(docker);
    }

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};

exports.start = function (_id, _call) {
    console.log("dockie.start: ");

    var exec_string = "docker start $(ID)";
    exec_string = exec_string.replace("$(ID)", _id);

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};

exports.stop = function (_id, _call) {
    console.log("dockie.stop: ", _id);

    var exec_string = "docker stop $(ID)";
    exec_string = exec_string.replace("$(ID)", _id);

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};

exports.unpause = function (_id, _call) {
    console.log("dockie.unpause: ", _id);

    var exec_string = "docker unpause $(ID)";
    exec_string = exec_string.replace("$(ID)", _id);

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};

exports.pause = function (_id, _call) {
    console.log("dockie.pause: ", _id);

    var exec_string = "docker pause $(ID)";
    exec_string = exec_string.replace("$(ID)", _id);

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};


exports.kill = function (_id, _call) {
    console.log("dockie.kill: ", _id);

    var exec_string = "docker kill $(ID)";
    exec_string = exec_string.replace("$(ID)", _id);

    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;
};


exports.destroy = function (_id, _call) {
    console.log("dockie.destroy", _id);

    var exec_string = "docker kill $(ID);docker rm $(ID); docker rmi $(ID);";
    exec_string = replaceAll("$(ID)", _id, exec_string);


    function stream(err1, err2, stdout) {
        log.info([exec_string, err1, err2, stdout]);
        _call(err1, err2, stdout);
    }

    var child = exec(exec_string, stream);

    return child;

};

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
};


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

};


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
};

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

};

exports.stopNginxProxy = function(){
    var child = exec("$(boot2docker shellinit); make stop_proxy", function(err,stdout,stderr){
        console.log("stdout2: " + stdout);
        console.log("stderr2: " + stderr);
        if(err!=null){
            console.log("Error2: " + err);
        }
    });
};
