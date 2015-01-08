/**
 * Created by marekbejda on 1/1/15.
 */

var exec = require('child_process').exec;
var subDomains = ["alpha","beta","charlie","one","two","three","four"];



exports.getSub = function(){
    return subDomains[Math.floor(Math.random()*subDomains.length)];
}

exports.startDockfile = function(vhost, dockfile, _call){

    //docker run  -e "VIRTUAL_HOST=a.dockerhost.com" -t tutum/wordpress
    //var fullhost = "\"VIRTUAL_HOST="+vhost+".dockerhost.com\"";
    //var exec_string = "docker run  -d -e \"VIRTUAL_HOST=%vhost.dockerhost.com\" -t tutum/wordpress";
    //exec_string = exec_string.replace("%vhost", vhost);

    console.log("startDockfile: " , vhost, dockfile);

    var exec_string = "make start_dockfile VHOST=$VHOST DOCKFILE=$DOCKFILE";
    exec_string=exec_string.replace("$VHOST", vhost);
    exec_string=exec_string.replace("$DOCKFILE", dockfile);
    //var child = run('tutum/wordpress', {tty:true})

    var child = exec(exec_string, _call);

    return child;
}

exports.stopDockfile = function(vhost){

    console.log("stopDockfile: " + vhost);

    var child = exec("$(boot2docker shellinit); make stop_dockfile VHOST="+vhost, function(err,stdout,stderr){
        console.log("stdout2: " + stdout);
        console.log("stderr2: " + stderr);
        if(err!=null){
            console.log("Error2: " + err);
        }
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
