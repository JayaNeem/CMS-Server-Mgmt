const mysql = require('mysql');

const con = mysql.createConnection({
  host:'localhost',
  port:'3306',
  user:'root',
  password:'root',
  database:'cms_server_mgmt'
});

/*con.connect(function(err) {
	if(err)
		throw err;
	else
		console.log("Database connected successfully"); 
});*/

module.exports = con;