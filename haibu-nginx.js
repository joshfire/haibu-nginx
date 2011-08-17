var config = require("./config.js").config;

var request = require('request'),
    _ = require("underscore")._,
    fs = require("fs"),
    path = require("path");

console.log('Querying http://'+config.address+':'+config.port);

request('http://'+config.address+':'+config.port+'/drones', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    
    
    var nginx_upstream_conf = "";
    var nginx_reverseproxy_conf = "";
    
    
    var apps = JSON.parse(body);
    
    _.each(apps.drones,function(app,id) {
      
      nginx_upstream_conf+="upstream haibu-"+id+" {\n";
      
      _.each(app.drones,function(drone) {
        nginx_upstream_conf+="  server "+drone.host+":"+drone.port+";\n";
      });
      nginx_upstream_conf+="}\n\n";
      
      nginx_reverseproxy_conf+="server {\n"
                              +"  location / {\n"
                              +"    server_name "+app.app.domain+";\n"
                              +"    proxy_pass http://haibu-"+id+";\n"
                              +"  }\n"
                              +"}\n\n";
      
    });
    
    fs.writeFile(path.join(config.output_dir,config.output_file_upstream), nginx_upstream_conf, function(err) {
      if (err) {
        console.error("Couldn't write upstream conf:",error);
      } else {
        console.log("Wrote "+path.join(config.output_dir,config.output_file_upstream))
      }
    });
    
    fs.writeFile(path.join(config.output_dir,config.output_file_reverseproxy), nginx_reverseproxy_conf, function(err) {
      if (err) {
        console.error("Couldn't write reverseproxy conf:",error);
      } else {
        console.log("Wrote "+path.join(config.output_dir,config.output_file_reverseproxy));
      }
    });
    
  } else {
    console.error("Couldn't connect to haibu-server:",error);
  }
});
