var express = require('express');
var router = express.Router();
var dockie = require(__dirname + "/../bin/dockie.js");
var dns = require(__dirname + "/../bin/redis-dns.js");

var schemas = require(__dirname + "/../bin/schemas.js");
var config = require(__dirname + "/../bin/config.json");


var HOST = config.HOST;

var winston = require('winston');

var log = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: __dirname + "/../logs/index.log", level:'info', timestamp:true, json:true })
    ]
});

var Dockerfile =  schemas.dockerfile;
var UATokens   =  schemas.uatokens;
var User       =  schemas.user;

var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
        clientID: config.FACEBOOK_APP_ID,
        clientSecret: config.FACEBOOK_APP_SECRET,
        callbackURL: "http://" + config.FACEBOOK_HOST + "/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        //log.info("accessToken: ", accessToken);
        //log.info("refreshToken: ", refreshToken);
        //log.info("profile: ", profile.emails[0].value);
        //log.info("done: ", done);
        console.log("profile: ", profile);

        User.findOrCreate({f_id: profile.id}, function (err, user, created) {

        if (err) {
            return done(err);
        } else if (created) {
            user.profile = profile;
            user.save(function (err, item) {
                return done(null, user);
            })
        } else {
            return done(null, user);
        }
      });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


router.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['read_stream', 'publish_actions'] })
);


router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
      failureRedirect: '/login' }));

router.get('/logout', function(req,res){
    req.logout();
    res.redirect('/');
});


/* GET home page. */
router.get('/',ensureAuthenticated, function(req, res) {
  res.render('index', { user:req.user, HOST: HOST});
});

/* GET home page. */
router.get('/stops', function(req, res) {
    res.render('stops', { user:req.user});
});

router.get("/login", function(req,res){
   res.render("login");
});

router.get("/api/list", ensureAuthenticated, function(req,res){
    log.info("/api/list: ", req.user._id);
    if(!req.user || !req.user._id ){
        console.log("err");
        res.send("err");
        return;
    }

    User.findById(req.user._id, function(err, user ){

        if(err){
            log.info("Error finding User: ", req.user._id) ;
            res.send("err");
            return;
        }else if(!user){
            res.send("err");
            return;
        }

        if("undefined"  == typeof user.dockerFiles ){
            res.send(user);
            return;
        }

        Dockerfile.find({_id: {$in: user.dockerFiles}},function(err, items){
            if(err){
                log.info("Error with Dockerfiles: ", err);
            }else{
                //log.info("Found dockerfiles: " , items);
            }

            res.send(items);
        })
    })
});

/* GET home page. */
router.get('/creative.html', function(req, res) {
    res.render('creative', { title: 'Express', user:null});
});

router.get('/fashion.html', function(req, res) {
    res.render('fashion', { title: 'Express', user:null});
});

router.get('/agency.html', function(req, res) {
    res.render('agency', { title: 'Express', user:null});
});

router.get('/api/remove',ensureAuthenticated, function(req,res) {
    log.info("api.remove");
    //var vhost = req.query.subdomain;
    var _id = req.query._id;


    User.findById(req.user._id, function(err, user){


        function _call() {
         user.save(function(err,user){
                if(err) {log.info("Error saving user" );}
         });

         Dockerfile.findOneAndRemove({_id: _id},function(err){

             if(err){
                 log.info("ERROR: " +  err);
                 res.send("err");
             }  else{
                 res.send("ok");
             }
          });
        }

        if(err ) log.info("ERROR: " + err);


        var idx = user.dockerFiles.indexOf(_id);

        if(idx!= -1) user.dockerFiles.splice(idx,1);


        dockie.stopDockfile(_id, _call);

    });



});

router.get("/api/container", ensureAuthenticated, function (req, res) {
    var item = req.query;
    var u_id = req.user._id;

    console.log("api.container.get:", item._id);

    if (!item) {
        res.send("err");
        return;
    }
    /**
     * Need to validate user request... if the user actually owns the
     * requested container.
     */

    Dockerfile.findOne({_id: item._id}, function (err, docker) {
        if (err) {
            res.send("err");
            return;
        }
        res.send(docker);
    });
});


router.put("/api/container", ensureAuthenticated, function (req, res) {
    var item = req.body;
    var u_id = req.user._id;
    var d_id = item._id;
    delete item._id;

    console.log("api.container.put:", item);
    if (!item) {
        res.send("err");
        return;
    }

    console.log("_ID: " + d_id);

    Dockerfile.findByIdAndUpdate(d_id, {$set: item}, {new: false}, function (err, old_docker) {

        if (err) {
            console.log("Error updating: " + err);
            res.send("err");
        }
        console.log("OLD: ", old_docker);
        console.log("NEW: ", item);

        if (item.domain != old_docker.domain) {
            old_docker.domain = item.domain;

            dns.commitRecord(old_docker);
            res.send("ok");

            //function _call3(err1, err2, stdout) {
            //    //console.log(err1, err2, stdout);
            //    //dns.commitRevord
            //}
            //
            //function _call2() {
            //    //dockie.run(old_docker, _call3);
            //
            //}
            //
            //function _call1() {
            //    //dockie.commit(old_docker.docker_id, d_id, _call2);
            //}


            //dockie.stop(old_docker.docker_id, _call1);
        }
    });
});

router.get("/api/container/commit", ensureAuthenticated, function (req, res) {
    log.info("api.container.commit.get", req.query);
    var _id = req.query._id;
    var u_id = req.user._id;

    Dockerfile.findById(_id, function (err, item) {
        if (err || !item) {
            log.info("Couldn't find dockfile: ", _id, err, item);
        }

        function _call(err1, err2, stdout) {
            console.log(err1, err2, stdout);
            item.commited = true;
            item.save(function (err, item) {
                if (err) {
                    res.send("err");
                } else {
                    res.send("ok");
                }
            })
        }

        dockie.commit(item.docker_id, item._id, _call);
    });
});

router.put("/api/container/status", ensureAuthenticated, function (req, res) {
    log.info("api.container.status.put", req.body);
    var status = req.body.status;
    var _id = req.body._id;


    Dockerfile.findById(_id, function (err, docker) {

        function def(err1, err2, stdout) {
            if (err1) {
                res.send(err1);
            } else {
                if (status == "started" || status == "unpaused") {
                    docker.status = "running";
                } else {
                    docker.status = status;
                }
                docker.save(function (err, dock) {
                    if (err) {
                        res.send("err");
                    } else {
                        res.send("ok");
                    }
                })
            }
        }

        switch (status) {
            case "started":
                dockie.start(docker.docker_id, def);
                break;
            case "stopped":
                //dockie.commit(_id);
                dockie.stop(docker.docker_id, def);
                break;

            case "paused":
                dockie.pause(docker.docker_id, def);
                break;

            case "unpaused":
                dockie.unpause(docker.docker_id, def);
                break;

            case "destroyed":
                dockie.destroy(docker.docker_id, function () {
                    Dockerfile.findByIdAndRemove(_id, function (err, item) {
                        if (err) {
                            console.log("problems removing: ", err);
                            res.send("err");
                        } else {
                            console.log("docker removed ", item._id);
                            User.findById(req.user._id, function (err, user) {
                                if (err) {
                                    console.log("problems finding user: ", err);
                                    res.send("err");
                                } else {
                                    var idx = user.dockerFiles.indexOf(_id);
                                    if (idx != -1)
                                        user.dockerFiles.splice(idx, 1);
                                    user.save(function (err) {
                                        if (err) {
                                            console.log("problems finding user: ", err);
                                            res.send("err");
                                            return;
                                        }
                                        console.log("docker removed from user ", user);
                                        res.send("ok")
                                    })
                                }
                            })
                        }
                    })
                });
                break;

            default:
                res.send("err");
        }
    });
});

router.post("/api/container", ensureAuthenticated, function (req, res) {
    var item = req.body;
    var u_id = req.user._id;

    console.log("api.container.post.", item);

    if (!item) {
        res.send("err");
        return;
    }

    item.opts = item['opts[]'];

    var docker = new Dockerfile(item);

    function _userUpdate(docker) {
        User.findById(u_id, function (err, user) {
            if (!u_id) {
                res.send("err");
                return;
            }
            user.dockerFiles.push(docker._id);
            user.save(function (err) {
                if (err) {
                    console.log("User not updated: ", err);
                    res.send("err");
                } else {
                    console.log("User updated");
                    dns.commitRecord(docker);
                    res.send("ok");
                }
            });
        })
    }

    function _saveme(docker_id, __inspect) {

        docker.docker_id = docker_id;
        docker.inspect = __inspect;
        docker.save(function (err, newItem) {
            if (err) {
                console.log("Error saving: ", err);
            }
            if (item) {
                //console.log("Created: ", newItem);
                _userUpdate(newItem);
            } else {
                console.log("Couldn't create item", item);
                res.send("err");
            }
        });
    }

    function _inspect(err1, err2, stdout) {
        if (err1) {
            res.send("err");
            return;
        } else {
            docker_id = err2.replace("\n", "");
        }

        dockie.inspect(docker_id, _saveme);
    }

    dockie.run(docker, _inspect);
});


router.get("/api/test", function (req, res) {
    log.info("api/test " + req.query._id);


    var _id = req.query._id;
    if (!_id) {
        res.send("err");
        return;
    } else {
        console.log("_ID: ", _id);
    }

    Dockerfile.findById(_id, function (err, item) {
        log.info("Returned with: ", typeof item);
        dockie.run(item);

        function _call(err1, err2, stdout) {
            console.log(err1, err2, stdout);
            res.send("ok");

        }
    });
});

router.get('/api/edit', ensureAuthenticated, function (req, res) {
    var _id = req.query._id;

    User.findById(req.user._id, function (_err, _user) {
        if (_err || !_user || !_user.dockerFiles) {
            res.send("err0");
            return;
        }


        var idx = _user.dockerFiles.indexOf(_id);
        if (idx == -1) {
            res.send("err1");
            return;
        }


        Dockerfile.findOne({_id: _id}, function (err, item) {
            if (_err || !item) {
                res.send("err2");
                return;
            }
            res.send(item);
        });
    });
});

router.get('/api/create',ensureAuthenticated, function(req,res){
    log.info("api.create", req.query.subdomain,req.query.service,req.query.opts);


    function _call2(err, inspect) {
        var img  = new Dockerfile();
        img.subdomain = req.query.subdomain;
        img.service = req.query.service;
        img.opts = req.query.opts;
        img._id = stdout.substring(stdout.indexOf("\n")+1).trim();
        img.status = "on";
        img.inspect = inspect;

        log.info("Got img: " , img);

        User.findById(req.user._id, function(_err, _user) {
                if (_err) {
                    console.log("ERROR: " + _err);
                    res.send("err");

                } else {
                    console.log("Found: " + _user);

                    if (undefined == _user.dockerFiles) _user.dockerFiles = [];

                    dns.commitRecord(img);

                    img.save(function(err,item){
                        if(err) {
                            console.log("There was a problem saving");
                        }
                        console.log("ITEM: ", item);
                            _user.dockerFiles.push(item.id);
                            _user.save(function (err) {
                                console.log("ERROR SAVING: ", err);
                            });
                    })

            }})
    }

    function _call(err, stdout, stderr) {
        if (err != null) {
            log.info("Error2: " + err);
            log.info("STDERR2: " + stderr);
        }
        dockie.inspect(img, _call2);
    }



    var env1 = "\"-e PLUGINS='$PLUGINS'\"";
    env1 = env1.replace("$PLUGINS",req.query.opts.join(";"));
    var vhost = req.query.subdomain +"."+ HOST;
    var docker = req.query.service;

    dockie.startDockfile(vhost,docker, env1,  _call);

    res.send("working..");
});


router.put('/api', ensureAuthenticated, function (req, res) {
    log.info("api.update", req.body.service);

    var service = JSON.parse(req.body.service);
    var _id = service._id;
    delete service._id;

    /*
     Updates do not work with _id fields in the updating object.
     */

    Dockerfile.update({_id: _id}, service, function (err, number) {
        if (err) {
            console.log("Error updating " + service._id);
            res.send("err")
        } else {
            console.log("Effected " + number);
            dns.commitRecord(service);
            res.send("ok")
        }
    });
});




router.get('/api/stop',ensureAuthenticated, function(req,res){
    log.info("api.stop: ", req.query.vhost);

    var status =   dockie.stopDockfile(req.query.vhost);
    res.render('index', {title: status});
});

router.get('/api/status',ensureAuthenticated, function(req,res){
    log.info("api.status ");

    var status =   dockie.status();

    res.send("ok");
});



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else{
        res.redirect("/login");
        // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
    }
}

module.exports = router;
