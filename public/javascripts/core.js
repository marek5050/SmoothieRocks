var wordpressPlugins = [
    {name: "BuddyPress", install: "bbpress"},
    {name: "WooCommerce", install: "woocommerce"},
    {name: "All in One SEO Pack", install: "all-in-one-seo-pack"},
    {name: "Jetpack by WordPress.com", install: "jetpack"},
    {name: "WordPress SEO by Yoast", install: "wordpress-seo"},
    {name: "Google Analytics by Yoast", install: "google-analytics-for-wordpress"},
    {name: "Google XML Sitemaps", install: "google-sitemap-generator"},
    {name: "Page Builder by SiteOrigin", install: "siteorigin-panels"}
]

var items = [
    {name: "wordpress", docker: "mbejda/wordpress-wpcli-plugins" , opts: wordpressPlugins }
    , {name: "redis", docker: "mbejda/wordpress-wpcli-plugins" , opts: [] }
    , {name: "mongodb", docker: "mbejda/wordpress-wpcli-plugins" ,opts: [] }
];

var blank = {
    name:"",
    docker:"",
    opts:[]
}


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

    self.selectService = function(item){
        console.log("selectService", item, self);

        self.service(item.docker);
        self.options(item.opts);
    }

    self.addServiceShow = function(){
        console.log("addServiceShow");

        self.visible(!self.visible());
    }


    self.saveService = function(){
        console.log("addService", this, this.valid());

        if(!self.valid()){
            return false;
        }else{
            var serial = {
                subdomain: self.subdomain(),
                opts: self.opts(),
                service: self.service()
            }

            $.get("/api/create", serial, function(response){
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
    var parent = _parent;

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


    self.trashService = function(item){
        $.ajax({url: "/api/remove", type: "GET" ,data:{_id: item._id}, success: function(response) {
            if(response == "ok"){
                self.fetchContainers();
            }
            console.log(response);
        }})
    }
}





function dnsManagerViewModel(_parent){
    console.log("initializing dnsManagerViewModel");
}



function Smoothie(){
    var self = this;
    self.name= "Smoothie.Rocks";
    self.addContainerManager = new addContainerViewModel(self);
    self.containerManager = new containerManagerViewModel(self);
    self.dns_manager = new dnsManagerViewModel(self);

    self.refresh = function(){
        self.containerManager.fetchContainers();
    }

    self.refresh();
}
