var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');

const con = require('../models/Db');

var transporter = nodemailer.createTransport({
  	service: 'gmail',
  	auth: {
    	user: 'jn08503@gmail.com',
    	pass: 'jn@dws12'
  	},
  	tls: { rejectUnauthorized: false }
});

router.get('/', (req, res) => {
	var sql = "select account.id, email, domain_name, expiry_date from account, customer where account.customer_id=customer.id and datediff(expiry_date, now()) < 8";
	con.query(sql, (err, result) => {
		if (err) 
			throw err;
		else {
			if (result.length > 0) {
				result.forEach(account => {
					var mailOptions = {
		     	 		from: 'jn08503@gmail.com',
		      			to: account.email,
		      			subject: 'CMS-Server Management account: Account expiry reminder',
		      			text: "Your account (id=" +account.id +") having domain name \'"+ account.domain_name+"\' is going to expire on " 
		      				+ account.expiry_date 
		      				+"\nFor continuing service recharge as soon as possible"
		    		};
		    		transporter.sendMail(mailOptions, function(err, info) {
		      			if (err) 
		      				throw err;
		        		console.log('Password sent: ' +info.response);
		        		res.render('index');
		    		});
				});
			} else {
				res.render('index');
			}
		}
	});
});

router.post('/checkLogin', (req, res) => {
	var aid = req.body.aid;
	var sql = 'select * from admin where id = ? and password = ?';
	con.query(sql, [aid, req.body.password], (err, result) => {
		if (err)
			throw err;
		else if (result.length > 0) {
			req.session.aid = aid; 
			res.redirect('/home');
		}
		else
			res.render('index', { msg: 'Login Fail' });
	});
});

router.get('/home', (req, res) => {
	if (req.session.aid) 
		res.render('adminHome', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/');
});

router.get('/addCustomer', (req, res) => {
	if (req.session.aid)
		res.render('addCustomer', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/');
});

router.post('/addCustomer', (req, res) => {
	if (req.session.aid) {
		var email = req.body.email;
		var pwd = Math.random().toString(20).substr(2, 5);
		var sql = 'insert into customer(name, mobile, email, password) values (?, ?, ?, ?)';
		con.query(sql, [req.body.cname, req.body.mobile, email, pwd], (err, result) => {
			if (err)
				throw err;
			else if (result.affectedRows == 1) {
				var mailOptions = {
     	 			from: 'jn08503@gmail.com',
      				to: email,
      				subject: 'CMS-Server Management account created',
      				text: "Congratulations, Your account has been created on CMS-Server Management"
      				+"\nUse password \'" +pwd +"\' to login"
    			};
    			transporter.sendMail(mailOptions, function(err, info) {
      				if (err) 
      					throw err;
        			console.log('Password sent: ' +info.response);
        			res.render('addCustomer', { layout: 'layouts/adminLayout', msg: 'Account created successfully' });
    			});
    		} else
    			res.render('addCustomer', { layout: 'layouts/adminLayout', msg: 'Data not inserted.. try again' });
		});
	} else
		res.redirect('/');
});

router.get('/viewCustomer', (req, res) => {
	if (req.session.aid) {
		var sql = 'select * from customer';
		con.query(sql, (err, result) => {
			if (err)
				throw err;
			else
				res.render('viewCustomer', { data: result, layout: 'layouts/adminLayout' });
		});
	} else
		res.redirect('/');
});

router.get('/editCustomer', (req, res) => {
	if (req.session.aid) {
		var sql = 'select * from customer where id = ?';
		con.query(sql, [req.query.id], (err, result) => {
			if (err)
				throw err;
			else 
				res.render('editCustomer', { data: result[0], layout: 'layouts/adminLayout' });
		});
	}
	else
		res.redirect('/');
});

router.post('/editCustomer', (req, res) => {
	if (req.session.aid) {
		var name = req.body.name;
		var mobile = req.body.mobile;
		var email = req.body.email;
		var id = req.body.id;
		console.log(req.body.gridRadios);
		if (req.body.gridRadios == 'Yes') {
			var pwd = Math.random().toString(20).substr(2, 5);
			var sql = 'update customer set name = ?, mobile = ?, email = ?, password = ? where id = ?';
			con.query(sql, [name, mobile, email, pwd, id], (err, result) => {
				if (err)
					throw err;
				else {
					var mailOptions = {
	     	 			from: 'jn08503@gmail.com',
	      				to: email,
	      				subject: 'Password changed for CMS-Server Management account',
	      				text: "Your password has been changed on CMS-Server Management"
	      				+"\nNew password is \'" +pwd +"\'"
	    			};
	    			transporter.sendMail(mailOptions, function(err, info) {
	      				if (err) 
	      					throw err;
	        			console.log('Password sent: ' +info.response);
	        			res.redirect('/viewCustomer');
	    			});
				}
			});
		} else {
			var sql = 'update customer set name = ?, mobile = ?, email = ? where id = ?';
			con.query(sql, [name, mobile, email, id], (err, result) => {
				if (err)
					throw err;
				else 
					res.redirect('/viewCustomer');
			});
		}
	}
	else
		res.redirect('/');
});

router.get('/deleteCustomer', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from customer where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/viewCustomer');
		});
	} else
		res.redirect('/');
});

router.get('/addPlan', (req, res) => {
	if (req.session.aid)
		res.render('addPlan', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/');	
});

router.post('/addPlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'insert into plan (name, charges) values (?, ?)';
		con.query(sql, [req.body.pname, req.body.charges], (err, result) => {
			if (err)
				throw err;
			else if (result.affectedRows == 1)
				res.render('addPlan', { layout: 'layouts/adminLayout', msg: 'Plan added' });
			else
				res.render('addPlan', { layout: 'layouts/adminLayout', msg: 'Plan not inserted.. try again' });
		});
	}
	else
		res.redirect('/');
});

router.get('/viewPlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'select * from plan';
		con.query(sql, (err, result) => {
			if (err)
				throw err;
			else
				res.render('viewPlan', { data: result, layout: 'layouts/adminLayout' });
		});
	} else
		res.redirect('/');
});

router.get('/editPlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'select * from plan where id = ?';
		con.query(sql, [req.query.id], (err, result) => {
			if (err)
				throw err;
			else
				res.render('editPlan', { layout: 'layouts/adminLayout', plan: result[0] });
		});
	} else
		res.redirect('/');
});

router.post('/editPlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'update plan set name = ?, charges = ? where id = ?';
		con.query(sql, [req.body.pname, req.body.charges, req.body.id], (err, result) => {
			if (err) 
				throw err;
			else
				res.redirect('viewPlan');
		});
	} else
		res.redirect('/');	
});

router.get('/deletePlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from plan where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/viewPlan');
		});
	} else
		res.redirect('/');	
});

router.get('/addAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'select id, name from customer';
		con.query(sql, (err, customers) => {
			if (err) throw err;
			else {
				// console.log(customers);
				var sql = 'select id, name from plan';
				con.query(sql, (err, planNames) => {
					if (err) throw err;
					else {
						// console.log(planNames);
						res.render('addAccount', { layout: 'layouts/adminLayout', planNames: planNames, customers: customers });
					}
				});
			}
		});
	}
	else
		res.redirect('/');	
});

//Ajax call 
router.get('/getHostingCharges', (req, res) => {
	if (req.session.aid) {
		var sql = 'select charges from plan where name = ?';
		con.query(sql, [req.query.inputPlanName], (err, result) => {
			if (err) throw err;
			else {
				console.log(result[0]);
				res.send({data: result[0]});
			}
		});
	}
	else
		res.redirect('/');	
});

router.post('/addAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'insert into account (customer_id, domain_name, plan_id, domain_taken, register_date, time_period, expiry_date, domain_charges, total_charges) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
		con.query(sql, [req.body.cid, req.body.dname, req.body.pid, req.body.domainRadios, req.body.rdate, req.body.timePeriod, req.body.edate, req.body.domaincharges, req.body.totalcharges], (err, result) => {
			if (err)
				throw err;
			else if (result.affectedRows == 1) {
				var sql = 'select id, name from customer';
				con.query(sql, (err, customers) => {
					if (err) throw err;
					else {
						var sql = 'select id, name from plan';
						con.query(sql, (err, planNames) => {
							if (err) throw err;
							else 
								res.render('addAccount', { layout: 'layouts/adminLayout', planNames: planNames, customers: customers, msg: 'Account added' });
						});
					}
				});
			}
			else {
				var sql = 'select id, name from customer';
				con.query(sql, (err, customers) => {
					if (err) throw err;
					else {
						var sql = 'select id, name from plan';
						con.query(sql, (err, planNames) => {
							if (err) throw err;
							else 
								res.render('addAccount', { layout: 'layouts/adminLayout', planNames: planNames, customers: customers, msg: 'Account added', msg: 'Account not inserted.. try again' });
						});
					}
				});
			}
		});
	}
	else
		res.redirect('/');	
});

router.get('/viewAccount', (req, res) => {
	if (req.session.aid) {
		var sql = "select account.id, customer.name as cname, account.domain_name, plan.name, account.domain_taken, account.register_date, account.time_period, account.expiry_date, account.domain_charges, account.total_charges from account, customer, plan where account.customer_id=customer.id and account.plan_id=plan.id";
		con.query(sql, (err, result) => {
			if (err) throw err;
			else {
				console.log(result);
				res.render('viewAccount', { layout: 'layouts/adminLayout', accounts: result });
			}
		});
	}
	else
		res.redirect('/');	
});

router.get('/editAccount', (req, res) => {
	if (req.session.aid) {
		var sql = "select * from account where account.id=?";
		con.query(sql, [req.query.id], (err, account) => {
			if (err)
				throw err;
			else {
				// console.log(account);
				var sql = 'select id, name from customer';
				con.query(sql, (err, customers) => {
					if (err) throw err;
					else {
						// console.log(customers);
						var sql = 'select id, name from plan';
						con.query(sql, (err, planNames) => {
							if (err) throw err;
							else {
								//console.log(planNames);
								res.render('editAccount', { account: account[0], layout: 'layouts/adminLayout', planNames: planNames, customers: customers });
							}
						});
					}
				});				
			}
		});
	}
	else
		res.redirect('/');
});

router.post('/editAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'update account set customer_id = ?, domain_name = ?, plan_id = ?, domain_taken = ?, register_date = ?, time_period = ?, expiry_date = ?, domain_charges = ?, total_charges = ? where id = ?';
		con.query(sql, [req.body.cid, req.body.dname, req.body.pid, req.body.domainRadios, req.body.rdate, req.body.timePeriod, req.body.edate, req.body.domaincharges, req.body.totalcharges, req.body.id], (err, result) => {
			if (err)  
				throw err;
			else {
				res.redirect('viewAccount');
			}
		});
	} else
		res.redirect('/');	
});

router.get('/deleteAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from account where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/viewAccount');
		});
	} else
		res.redirect('/');	
});

router.get('/logout', (req, res) => {
	if (req.session.aid) 
		req.session.destroy();
	res.redirect('/');
});

module.exports = router;