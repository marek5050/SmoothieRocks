var wordpressPlugins = [
    {name: "BuddyPress", install: "bbpress"},
    {name: "WooCommerce", install: "woocommerce"},
    {name: "All in One SEO Pack", install: "all-in-one-seo-pack"},
    {name: "Jetpack by WordPress.com", install: "jetpack"},
    {name: "WordPress SEO by Yoast", install: "wordpress-seo"},
    {name: "Google Analytics by Yoast", install: "google-analytics-for-wordpress"},
    {name: "Google XML Sitemaps", install: "google-sitemap-generator"},
    {name: "Page Builder by SiteOrigin", install: "siteorigin-panels"}
];

var rethinkDBPlugins = [
    {name: "BuddyPress", install: "bbpress"},
    {name: "WooCommerce", install: "woocommerce"},
    {name: "All in One SEO Pack", install: "all-in-one-seo-pack"},
    {name: "Jetpack by WordPress.com", install: "jetpack"},
    {name: "Jetpack by WordPress.com", install: "jetpack"}
];

var items = [
    {name: "Wordpress", img: "official_wordpress.png", docker: "mbejda/wordpress-wpcli-plugins", opts: wordpressPlugins}
    , {name: "Ghost", img: "official_ghost.png", docker: "orchardup/ghost", opts: []}
    , {name: "Redis", img: "official_redis.png", docker: "tutum/redis", opts: []}
    //, {name: "RethinkDB",img:"official_wordpress.png", docker: "dockerfile/mongodb" ,opts: [] }
    , {name: "Mongodb", img: "official_mongodb.png", docker: "tutum/mongodb", opts: []}
    //, {name: "Influxdb",img:"official_wordpress.png", docker: "dockerfile/mongodb" ,opts: [] }
    //, {name: "Mongodb",img:"official_wordpress.png", docker: "dockerfile/mongodb" ,opts: [] }
];

var blank = {
    name:"",
    docker:"",
    opts:[]
};


function addContainerViewModel(_parent){
    console.log("initialized addContainerViewModel");

    var self = this;
    self.parent = _parent;

    self.services = ko.observableArray(items);
    self.options = ko.observableArray("");
    self.service = ko.observable("");


    self.subdomain = ko.observable("");
    self.opts =ko.observableArray([]);

    self.visible = ko.observable(false);


    self.subvalid = ko.computed(function(){
        //console.log(self, self.subdomain());
        if("undefined" == typeof self) return 0;
        return  /^[a-z0-9]+$/i.test( self.subdomain());
    },self);

    self.valid =  ko.computed(function(){
        return self.subvalid() == true && self.service()!="";
    });

    self.selectService = function (item, evt) {
        console.log("selectService", item, self);

        if (evt && evt.target) {

            if (evt.target != "a.select") {
                evt = $(evt.target).parent();
            } else {
                evt = evt.target;
                console.log("TRUE? " + evt.target == "a.select");
            }

            $(".selected").removeClass("selected");
            $(evt).toggleClass("selected");
        }
        self.service(item.docker);
        self.options(item.opts);
    };

    self.addServiceShow = function(){
        console.log("addServiceShow");

        self.visible(!self.visible());
    };

    self.saveService = function(){
        console.log("addService", this, this.valid());

        if(!self.valid()){
            return false;
        }else{
            var service = {
                docker_id: "",
                subdomain: self.subdomain(),
                domain: "",
                opts: self.opts(),
                service: self.service(),
                status: "running",
                commited: false
            };

            $.post("/api/container", service, function (response) {
                if(response === "ok") alert("Service Added");
                else alert(response);

                self.selectService(blank);
                self.subdomain("");
                self.parent.refresh();
            })
        }
    };
}


function containerManagerViewModel(_parent){
    console.log("initializing containerManager");

    var self = this;
    self.parent = _parent;

    self.containers = ko.observableArray([]);

    self.fetchContainers = function(){
        console.log("fetchContainers");

        $.get("/api/list", function(containers){
            console.log("Received profile: ", containers);
            if(typeof containers == "string"){
                console.log("Could not fetch containers");
            }else{
                self.containers(containers);
            }
        })
    };

    self.edit = function (item) {
        console.log("scontainerManagerViewModel.edit");
        self.parent.edit(item._id);
    };

    self.trashService = function(item){
        $.ajax({url: "/api/remove", type: "GET" ,data:{_id: item._id}, success: function(response) {
            if(response == "ok"){
                self.fetchContainers();
            }
            console.log(response);
        }})
    }
}


var sample = {
    docker_id: "112312312312312",
    subdomain: "hellokitty",
    opts: ["snow", "pw", "puff", "fluff"],
    service: "tutum/wordpress",
    domain: "universe.com",
    status: "running"
};

function Container(_id) {
    console.log("Creating container ", _id);

    var self = this;
    self._id = _id || "";

    self.docker_id = ko.observable("");
    self.subdomain = ko.observable("");
    self.domain = ko.observable("");
    self.opts = ko.observableArray([]);
    self.service = ko.observable("");
    self.status = ko.observable("");

    self.load = function () {
        console.log("editManagerViewModel.load", _id);
        $.ajax({
            url: "/api/container",
            method: "get",
            data: {"_id": self._id},
            success: function (data) {
                if (data == 'err') {
                    self.status("Failed to retrieve container.");
                    console.log("Failed to load data");
                    return;
                }
                self.docker_id(data.docker_id || "invalid ID");
                self.subdomain(data.subdomain || " invalid Subdomain");
                self.domain(data.domain || "No domain");
                self.opts(data.opts || []);
                self.service(data.service || "invalid service");
                self.status(data.status || "");
            }
        })
    };

    self.save = function () {
        var container = {
            _id: self._id,
            subdomain: self.subdomain(),
            domain: self.domain()
        };

        $.ajax({
            url: "/api/container",
            type: "PUT",
            data: container,
            success: function (response) {
                if (response == "ok") {
                    $("edit_container").find("input").attr("disabled", "true");
                    $("edit_container").find(".status").html("Saved");
                }
                console.log(response);
            }
        })
    };
    self.setState = function (state) {

        $.ajax({
            url: "/api/container/status",
            type: "PUT",
            data: {_id: self._id, status: state},
            success: function (response) {
                console.log(response);

                if (response != "err") {
                    console.log("received good");
                    if (state != "destroyed")
                        self.load();
                    else {
                        self._id = "";
                        self.docker_id("");
                        self.subdomain("");
                        self.domain("");
                        self.opts([]);
                        self.service("");
                        self.status("");
                    }


                    $("body").trigger("refresh");
                }
            }
        })
    };

    self.commit = function () {
        $.get("/api/container/commit", {"_id": self._id}, function (data) {
            if (data == "err") {
                console.log(data);
            } else {
                console.log("Success");
            }
        });
    };
    self.destroy = function () {
        self.setState("destroyed");
    };
    self.stop = function () {
        self.setState("stopped");
    };
    self.start = function () {
        self.setState("started");
    };
    self.pause = function () {
        self.setState("paused");
    };
    self.unpause = function () {
        self.setState("unpaused");
    }
}

function editManagerViewModel(_parent) {
    console.log("initializing editManagerViewModel");
    var self = this;

    self.service = ko.observable(new Container(sample));

    self.toggle = function (item, button) {

        var input = $(button.target).closest("div").find("input");

        input.attr("disabled", !input.attr("disabled"));
    };
    self.edit = function (_id) {
        console.log("editManagerViewModel.edit" + _id);
        self.service(new Container(_id));
        self.service().load();
    }
}


function Smoothie(){
    var self = this;
    self.name= "Smoothie.Rocks";
    self.addContainer = new addContainerViewModel(self);
    self.listContainers = new containerManagerViewModel(self);
    self.editContainer = new editManagerViewModel(self);

    self.refresh = function(){
        self.listContainers.fetchContainers();
    };

    self.edit = function (_id) {
        console.log("parent.edit");
        self.editContainer.edit(_id);
    };

    $("body").bind("refresh", self.refresh);

    self.refresh();
}
