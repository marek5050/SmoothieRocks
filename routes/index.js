var express = require('express');
var router = express.Router();
var dockie = require("../bin/dockie.js");

var HOST = process.env.HOST;

var winston = require('winston');

var log = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: './logs/index.log', level:'info', timestamp:true, json:true })
    ]
});

var Dockerfile =  (require("../bin/schemas.js")).dockerfile;
var UATokens   =  (require("../bin/schemas.js")).uatokens;
var User       =  (require("../bin/schemas.js")).user;

var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "298638103625812";
var FACEBOOK_APP_SECRET = "cb11debfcb20bf0b88ebce48e94e652e";
var FACEBOOK_HOST = HOST || "localhost:8000";
passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: "http://"+ HOST + "/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        log.info("accessToken: ", accessToken);
        log.info("refreshToken: ", refreshToken);
        log.info("profile: ", profile.emails[0].value);
        log.info("done: ", done);


        User.findOrCreate( { email: profile.emails[0].value } , function(err, user) {
            //log.info("FOUND USER: ", user);
        if (err) {
            return done(err);
        }else{
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
})


/* GET home page. */
router.get('/',ensureAuthenticated, function(req, res) {
  res.render('index', { user:req.user});
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

    User.findById(req.user._id, function(err, user ){

        if(err)
            log.info("Error finding User: ", req.user.id) ;
        else if(!user){
            res.redirect("/login");
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
            //user = user.toObject();
            //user.items = items;
            //delete user.dockerFiles;

            res.send(items);
        })
    })
})

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


     function _call(){
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

        //log.info(user);

        var idx = user.dockerFiles.indexOf(_id);

        log.info(user.dockerFiles.length);

        if(idx!= -1) user.dockerFiles.splice(idx,1);

        log.info(user.dockerFiles.length);

        dockie.stopDockfile(_id, _call);

    });



});

router.get('/api/start',ensureAuthenticated, function(req,res){
    log.info("api.start", req.query.subdomain,req.query.service,req.query.opts);


    function _call(err,stdout,stderr){
        if(err!=null) {
            log.info("Error2: " + err);
            log.info("STDERR2: " + stderr);
        }

        var img  = new Dockerfile();
        img.subdomain = req.query.subdomain;
        img.service = req.query.service;
        img.opts = req.query.opts;
        img._id = stdout.substring(stdout.indexOf("\n")+1).trim();

        log.info("Got img: " , img);

        User.findById(req.user._id, function(_err, _user) {
                if (_err) {
                    log.info("ERROR: " + _err);
                } else {
                    log.info("Found: " + _user);

                    if (undefined == _user.dockerFiles) _user.dockerFiles = [];


                    img.save(function(err,item){
                        if(err) {
                            log.info("There was a problem saving");
                        }
                            log.info("ITEM: ", item);
                            _user.dockerFiles.push(item.id);
                            _user.save(function (err) {
                            log.info("ERROR SAVING: ", err);
                            });
                    })

            }})
    };

    var env1 = "\"-e PLUGINS='$PLUGINS'\"";
    env1 = env1.replace("$PLUGINS",req.query.opts.join(";"));
    var vhost = req.query.subdomain +"."+ HOST;
    var docker = req.query.service;

    dockie.startDockfile(vhost,docker, env1,  _call);

    res.send("working..");
});

router.get('/api/stop',ensureAuthenticated, function(req,res){
    log.info("api.stop: ", req.query.vhost);

    var status =   dockie.stopDockfile(req.query.vhost);
    res.render('index', {title: status});
});

router.get('/api/status',ensureAuthenticated, function(req,res){
    log.info("api.status ");

    var status =   dockie.status();
    res.render('index', {title: status});
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
