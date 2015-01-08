var express = require('express');
var router = express.Router();
var dockie = require("../bin/dockie.js");

var Dockerfile =  (require("../bin/schemas.js")).dockerfile;
var UATokens   =  (require("../bin/schemas.js")).uatokens;
var User       =  (require("../bin/schemas.js")).user;

var passport = require('passport')
    , FacebookStrategy = require('passport-facebook').Strategy;
var FACEBOOK_APP_ID = "298638103625812";
var FACEBOOK_APP_SECRET = "cb11debfcb20bf0b88ebce48e94e652e";

passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        console.log("accessToken: ", accessToken);
        console.log("refreshToken: ", refreshToken);
        console.log("profile: ", profile.emails[0].value);
        console.log("done: ", done);


        User.findOrCreate( { email: profile.emails[0].value } , function(err, user) {
            console.log("FOUND USER: ", user);
        if (err) { return done(err); }
        done(null, user);
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

router.get("/api/user", ensureAuthenticated, function(req,res){
    console.log("/api/user: ", req.user._id);

    User.findById(req.user._id, function(err, user ){

        if(err)
            console.log("Error finding User: ", req.user.id) ;

        if("undefined"  == typeof user.dockerFiles ){
            res.send(user);
            return;
        }

        Dockerfile.find({_id: {$in: user.dockerFiles}},function(err, items){
            if(err){
                console.log("Error with Dockerfiles: ", err);
            }else{
                console.log("Found dockerfiles: " , items);
            }
            user = user.toObject();
            user.items = items;
            delete user.dockerFiles;
            console.log("SENDING: ", user);

            res.send(user);
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

});

router.get('/api/start',ensureAuthenticated, function(req,res){

    console.log("api.start", req.query.subdomain,req.query.service,req.query.opts);
    //http://localhost:3000/api/run?vhost=alpha&dockerfile=tutum/wordpress&opts=
    //req.query.docker = "mbejda/wordpress-wpcli-plugins";


    function _call(err,stdout,stderr){
        if(err!=null) {
            console.log("Error2: " + err);
            console.log("STDERR2: " + stderr);
        }

        var img  = new Dockerfile();
        img.subdomain = req.query.subdomain;
        img.service = req.query.service;
        img.opts = req.query.opts;
        img._id = stdout.substring(stdout.indexOf("\n")+1).trim();


        User.findById(req.user._id, function(_err, _user) {
                if (_err) {
                    console.log("ERROR: " + _err);
                } else {
                    console.log("Found: " + _user);

                    if (undefined == _user.dockerFiles) _user.dockerFiles = [];


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

                    console.log("DockerFile: ", _user.dockerFiles);

            }})

        console.log(img);

        console.log("STDOUT: "  + stdout);
        console.log("stderr2: " + stderr);
      };


    dockie.startDockfile(req.query.subdomain, req.query.service, _call);

    res.send("working..");
});

router.get('/api/stop',ensureAuthenticated, function(req,res){
    console.log("api.stop: ", req.query.vhost);

    var status =   dockie.stopDockfile(req.query.vhost);
    res.render('index', {title: status});
});

router.get('/api/status',ensureAuthenticated, function(req,res){
    console.log("api.status ");

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
