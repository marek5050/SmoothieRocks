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
    {name: "wordpress", docker: "tutum/wordpress" , opts: wordpressPlugins }
    , {name: "redis", docker: "tutum/wordpress" , opts: [] }
    , {name: "mongodb", docker: "tutum/wordpress" ,opts: [] }
];


var _user = {
    items: [
            {subdomain: "hello", docker: "tutum/wordpress", opts: "woocommerce"},
            {subdomain: "hello1", docker: "tutum/wordpress", opts: "woocommerce"},
            {subdomain: "hello2", docker: "tutum/wordpress", opts: "woocommerce"}
        ]
};

var blank = {
    items:[]
    }

ko.extenders.alphanumeric = function(target, precision) {
    //create a writable computed observable to intercept writes to our observable
    var result = ko.pureComputed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            console.log("Write called" );
            var current = target(),
                valid =  /^[a-z0-9]+$/i.test( newValue),
                valueToWrite = (valid)? newValue: "";

            console.log("Valid: " + valid + " New value: " +  newValue);
            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });

    //initialize with current value to make sure it is rounded appropriately
    result(target());

    //return the new computed observable
    return result;
};


function Smoothie(){
    var self = this;
    self.name= "Smoothie.Rocks";
    self.newService = {};
    self.newService.visible = ko.observable(false);
    self.newService.subdomain = ko.observable("");
    self.newService.service = ko.observable("");
    self.newService.opts =ko.observableArray([]);
    self.newService.subvalid = ko.computed(function(){
            if("undefined" == typeof self.newService) return 0;
            return  /^[a-z0-9]+$/i.test( self.newService.subdomain());
        },self);
    self.newService.valid =  ko.computed(function(){

            return self.newService.subvalid() == true && self.newService.service()!="";

    })
    self.addServiceShow = function(){
        console.log(self.newService.visible());
        self.newService.visible(!self.newService.visible());
    }
    self.services = ko.observableArray(items);
    self.options = ko.observableArray();

    self.user = ko.observable(blank);
    self.fetchContainers = function(){
        console.log("Get containers");

        $.get("/api/user", function(profile){
            //console.log(response);
            self.user(profile);
        })
    };
    self.addService = function(){
        console.log("New Service", self.newService, self.newService.valid());
        if(!self.newService.valid()){
            return false;
        }else{
            var serial = self.newService;
            delete serial.valid;
            delete serial.subvalid;

            var plainJs = ko.toJS(serial);
            console.log("PlainJS : ",  plainJs);

            $.get("/api/start", plainJs, function(response){
                alert("Service Added");
                self.services([]);
                self.options([]);
                self.fetchContainers();
            })
        }
    };

    self.selectService = function(item){
        console.log("Selecting New Service", item);
        self.newService.service(item.docker);
        self.options(item.opts);
    };

    self.trashService = function(item){
        $.ajax({url: "/api/remove", type: "GET" ,data:item, success: function(response) {
            console.log(response);
        }})
     }

    self.fetchContainers();
}