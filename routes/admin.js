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
	var sql = "select account.id, email, domain_name, expiry_date "
			+ "from account, customer " 
			+ "where account.customer_id=customer.id and datediff(expiry_date, now()) < 8";
	con.query(sql, (err, result) => {
		if (err) 
			throw err;
		else if (result.length > 0) {
			result.forEach(account => {
				var mailOptions = {
	     	 		from: 'jn08503@gmail.com',
	      			to: account.email,
	      			subject: 'CMS-Server Management account: Account expiry reminder',
	      			text: "Your account (id=" + account.id + ") having domain name \'" 
	      				+ account.domain_name + "\' is going to expire on " 
	      				+ account.expiry_date 
	      				+ "\nFor continuing service recharge as soon as possible"
	    		};
	    		transporter.sendMail(mailOptions, function(err, info) {
	      			if (err) 
	      				throw err;
	        		console.log('Password sent: ' +info.response);
	    		});
			});
			res.render('index');
		}
		else 
			res.render('index');
	});
});

router.get('/forgetPwd', (req, res) => {
	res.render('forgetPwd'); 
});

router.post('/submitId', (req, res) => {
	var sql = 'select id from admin';
	var pwd = Math.random().toString(20).substr(2, 5);
	con.query(sql, (err, result) => {
		if (err) throw err;
		else if (req.body.id == result[0].id) {
			var mailOptions = {
 	 			from: 'jn08503@gmail.com',
  				to: req.body.id,
  				subject: 'OTP for change Password : CMS-Server Management',
  				text: "OTP is "
  					+ "\n" + pwd
			};
			transporter.sendMail(mailOptions, function(err, info) {
  				if (err) 
  					throw err;
    			console.log('Password sent: ' +info.response);
    			res.render('checkOtp', { otp: pwd, id: req.body.id });
    			// res.render('checkOtp', { otp: pwd, id: req.body.id });
			});
		}
		else
			res.render('forgetPwd', { msg: 'Enter Correct Id' });
	});
});

router.post('/submitOtp', (req, res) => {
	res.render('newPwd', { id: req.body.id });
});

router.post('/submitPwd', (req, res) => {
	var sql = 'update admin set password = ? where id = ?';
	con.query(sql, [req.body.nPwd, req.body.id], (err, result) => {
		if (err) throw err;
		else 
			res.render('index', { successMsg: 'Password changed successfully' });
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
			res.redirect('/admin/home');
		}
		else
			res.render('index', { msg: 'Login Fail' });
	});
});

router.get('/home', async (req, res) => {
	if (req.session.aid) {
		function getBarChartData() {
			return new Promise(function(resolve, reject) {	
				var sql = 'select month(current_date()) as current_date_month from dual';
				con.query(sql, (err, result) => {
					if (err) reject(err);
					else {
						var currentDateMonth = result[0].current_date_month;
						var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
						if (currentDateMonth > 4) {
							var sql = 'select count(*) as c, month(register_date) as m '
									+ 'from account '
									+ 'where month(register_date) in (month(current_date()), month(current_date()) - 1, month(current_date()) - 2, month(current_date()) - 3, month(current_date()) - 4) '
									+ 'and year(register_date) = year(current_date()) '
									+ 'group by month(register_date)';
							con.query(sql, (err, result) => {
								if (err) reject(err);
								else {
									var modifiedResult = {}, finalArr = [];
									result.forEach(item => {
										let temp = item.m;
										modifiedResult[temp] = item.c;
									});
									for (var i = currentDateMonth; i > currentDateMonth-5; i--) {
										if (!modifiedResult[i]) 
											modifiedResult[i] = 0;
									}
									for (key in modifiedResult) 
										finalArr.push({label: months[Number(key)-1], y: modifiedResult[key]});
									resolve(finalArr);
								}
							});
						} else {
							var sql = 'select count(*) as c, month(register_date) as m '
									+ 'from account '
									+ 'where month(register_date) in (?) ' 
									+ 'and year(register_date) in (year(current_date()), year(current_date()) - 1) '
									+ 'group by month(register_date)';
							var monthArr = [];
							var month = currentDateMonth;
							for (var i = 1; i < 6; i++) {
								monthArr.push(month);
								if (month == 1)
									month = 12;
								else
									month--;
							}
							con.query(sql, [monthArr], (err, result) => {
								if (err) reject(err);
								else {
									var modifiedResult = {}, finalArr = [];
									result.forEach(item => {
										let temp = item.m;
										modifiedResult[temp] = item.c;
									});
									var t = currentDateMonth;
									for (var i = 0; i < 5; i++) {
										if (!modifiedResult[t]) 
											modifiedResult[t] = 0;
										if (t == 1) {
											t = 12;
											continue;
										}
										t--;
									}
									for (key in modifiedResult) 
										finalArr.push({label: months[Number(key)-1], y: modifiedResult[key]});
									resolve(finalArr);
								}
							});
						}
					}
				});
			});
		}
		function getDonoutChartData() {
			return new Promise(function(resolve, reject) {
				var sql = 'select count(*) as c, name ' 
						+ 'from account, plan '
						+ 'where account.plan_id = plan.id group by plan_id';
				con.query(sql, (err, result) => {
					if (err) reject(err);
					else 
						resolve(result);
				})
			});
		}
		var barChartData = await getBarChartData();
		var donoutChartData = await getDonoutChartData();
		res.render('adminHome', { layout: 'layouts/adminLayout', barChartData: barChartData, donoutChartData: donoutChartData });
	}
	else
		res.redirect('/admin');
});

router.get('/addCustomer', (req, res) => {
	if (req.session.aid)
		res.render('addCustomer', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/admin');
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
      					+ "\nUse password \'" + pwd + "\' to login"
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
		res.redirect('/admin');
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
		res.redirect('/admin');
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
		res.redirect('/admin');
});

router.post('/editCustomer', (req, res) => {
	if (req.session.aid) {
		var name = req.body.name;
		var mobile = req.body.mobile;
		var email = req.body.email;
		var id = req.body.id;
		// console.log(req.body.gridRadios);
		if (req.body.gridRadios == 'Yes') {
			var pwd = Math.random().toString(20).substr(2, 5);
			var sql = 'update customer set name = ?, mobile = ?, email = ?, password = ? ' 
					+ 'where id = ?';
			con.query(sql, [name, mobile, email, pwd, id], (err, result) => {
				if (err)
					throw err;
				else {
					var mailOptions = {
	     	 			from: 'jn08503@gmail.com',
	      				to: email,
	      				subject: 'Password changed for CMS-Server Management account',
	      				text: "Your password has been changed on CMS-Server Management"
	      					+ "\nNew password is \'" + pwd + "\'"
	    			};
	    			transporter.sendMail(mailOptions, function(err, info) {
	      				if (err) 
	      					throw err;
	        			console.log('Password sent: ' +info.response);
	        			res.redirect('/admin/viewCustomer');
	    			});
				}
			});
		} else {
			var sql = 'update customer set name = ?, mobile = ?, email = ? where id = ?';
			con.query(sql, [name, mobile, email, id], (err, result) => {
				if (err)
					throw err;
				else 
					res.redirect('/admin/viewCustomer');
			});
		}
	}
	else
		res.redirect('/admin');
});

router.get('/deleteCustomer', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from customer where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/admin/viewCustomer');
		});
	} else
		res.redirect('/admin');
});

router.get('/addPlan', (req, res) => {
	if (req.session.aid)
		res.render('addPlan', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/admin');	
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
		res.redirect('/admin');
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
		res.redirect('/admin');
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
		res.redirect('/admin');
});

router.post('/editPlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'update plan set name = ?, charges = ? where id = ?';
		con.query(sql, [req.body.pname, req.body.charges, req.body.id], (err, result) => {
			if (err) 
				throw err;
			else
				res.redirect('/admin/viewPlan');
		});
	} else
		res.redirect('/admin');	
});

router.get('/deletePlan', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from plan where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/admin/viewPlan');
		});
	} else
		res.redirect('/admin');	
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
					else 
						res.render('addAccount', { layout: 'layouts/adminLayout', planNames: planNames, customers: customers });
				});
			}
		});
	}
	else
		res.redirect('/admin');	
});

//Ajax call 
router.get('/getHostingCharges', (req, res) => {
	if (req.session.aid) {
		var sql = 'select charges from plan where name = ?';
		con.query(sql, [req.query.inputPlanName], (err, result) => {
			if (err) throw err;
			else
				res.send({data: result[0]});
		});
	}
	else
		res.redirect('/admin');	
});

router.post('/addAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'insert into account (customer_id, domain_name, plan_id, domain_taken, register_date, time_period, expiry_date, domain_charges, total_charges) ' 
				+ 'values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
		con.query(sql, 
			[req.body.cid, req.body.dname, req.body.pid, req.body.domainRadios, req.body.rdate, req.body.timePeriod, req.body.edate, req.body.domaincharges, req.body.totalcharges], 
			(err, result) => {
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
		res.redirect('/admin');	
});

router.get('/viewAccount', (req, res) => {
	if (req.session.aid) 
		res.render('viewAccount', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/admin');	
});

router.get('/editAccount', (req, res) => {
	if (req.session.aid) {
		var sql = "select * from account where account.id=?";
		con.query(sql, [req.query.id], (err, account) => {
			if (err)
				throw err;
			else {
				var sql = 'select id, name from customer';
				con.query(sql, (err, customers) => {
					if (err) throw err;
					else {
						var sql = 'select id, name from plan';
						con.query(sql, (err, planNames) => {
							if (err) throw err;
							else
								res.render('editAccount', { account: account[0], layout: 'layouts/adminLayout', planNames: planNames, customers: customers });
						});
					}
				});				
			}
		});
	}
	else
		res.redirect('/admin');
});

router.post('/editAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'update account set customer_id = ?, domain_name = ?, plan_id = ?, domain_taken = ?, register_date = ?, time_period = ?, expiry_date = ?, domain_charges = ?, total_charges = ? '
				+ 'where id = ?';
		con.query(sql, 
			[req.body.cid, req.body.dname, req.body.pid, req.body.domainRadios, req.body.rdate, req.body.timePeriod, req.body.edate, req.body.domaincharges, req.body.totalcharges, req.body.id], 
			(err, result) => {
			if (err)  
				throw err;
			else 
				res.redirect('/admin/viewAccount');
		});
	} else
		res.redirect('/admin');	
});

router.get('/deleteAccount', (req, res) => {
	if (req.session.aid) {
		var sql = 'delete from account where id = ?';
		con.query(sql, [req.query.id], (err) => {
			if (err)
				throw err;
			else
				res.redirect('/admin/viewAccount');
		});
	} else
		res.redirect('/admin');	
});

//Ajax call from viewAcount
router.get('/getMonthRows', (req, res) => {
	if (req.session.aid) {
		if (req.query.filter == 'none') {
			var sql = 'select account.id, customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
					+ 'from account, customer, plan '
					+ 'where account.customer_id = customer.id and account.plan_id = plan.id';
			con.query(sql, (err, result) => {
				if (err) throw err;
				else 
					res.send(result);
			});
		}
		else if (req.query.filter == 'currentMonth') {
			var sql = 'select account.id, customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
					+ 'from account, customer, plan '
					+ 'where month(expiry_date) = month(current_date()) and year(expiry_date) = year(current_date()) '
					+ 'and account.customer_id = customer.id and account.plan_id = plan.id';
			con.query(sql, (err, result) => {
				if (err) throw err;
				else 
					res.send(result);
			});
		} else {
			var sql = 'select month(current_date()) as current_date_month from dual';
			con.query(sql, (err, result) => {
				if (err) throw err;
				else {
					var currentDateMonth = result[0].current_date_month;
					if(currentDateMonth < 9) {
						var sql = 'select account.id, customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
								+ 'from account, customer, plan '
								+ 'where month(expiry_date) in (month(current_date()), month(current_date()) + 1, month(current_date()) + 2, month(current_date()) + 3, month(current_date()) + 4) '
								+ 'and year(expiry_date) = year(current_date()) '
								+ 'and account.customer_id = customer.id and account.plan_id = plan.id';
						con.query(sql, (err, result) => {
							if (err) throw err;
							else 
								res.send(result);
						});
					} else {
						var sql = 'select account.id customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
								+ 'from account, customer, plan '
								+ 'where month(expiry_date) in (?) and year(expiry_date) in (year(current_date()), year(current_date())+1) '
								+ 'and account.customer_id = customer.id and account.plan_id = plan.id';
						var monthArr = [];
						var month = currentDateMonth;
						for (var i = 1; i < 6; i++) {
							monthArr.push(month);
							if (month == 12)
								month = 1;
							else
								month++;
						}
						con.query(sql, [monthArr], (err, result) => {
							if (err) throw err;
							else 
								res.send(result);
						});
					}
				}
			});			
		}
	}
	else
		res.redirect('/admin');	
});

router.get('/viewTransaction', (req, res) => {
	if (req.session.aid) 
		res.render('viewTransaction', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/admin');
});

//ajax call
router.get('/getTransactionRows', (req, res) => {
	if (req.session.aid) {
		var sql = 'select customer.name as cname, sum(domain_charges) as domain_charges, sum(charges) as charges, sum(total_charges) as total_charges ' 
				+ 'from customer, account, plan ' 
				+ 'where account.customer_id = customer.id and account.plan_id = plan.id '
				+ 'group by cname';
		con.query(sql, (err, result) => {
			if (err) throw err;
			else 
				res.send(result);
		});
	} else
		res.redirect('/admin');
});

//ajax call
router.post('/getTransactionRowsByDate', (req, res) => {
	if (req.session.aid) {
		var sql = 'select customer.name as cname, sum(domain_charges) as domain_charges, sum(charges) as charges, sum(total_charges) as total_charges '
				+ 'from customer, account, plan ' 
				+ 'where account.customer_id = customer.id and account.plan_id = plan.id and register_date between ? and ? '
				+ 'group by cname';
		con.query(sql, [req.body.startDate, req.body.endDate],(err, result) => {
			if (err) throw err;
			else 
				res.send(result);
		});
	} else
		res.redirect('/admin');
});

router.get('/changePwd', (req, res) => {
	if (req.session.aid)
		res.render('changePwd', { layout: 'layouts/adminLayout' });
	else
		res.redirect('/admin');
});

router.get('/checkCurrentPassword', (req, res) => {
	if (req.session.aid) {
		var sql = 'select * from admin where id = ? and password = ?';
		con.query(sql, [req.session.aid, req.query.cPwd], (err, result) => {
			if (err) throw err;
			else if (result.length > 0) 
				res.send({ msg: 'Correct' });
			else 
				res.send({ msg: 'Incorrect' });
		});
	}
	else
		res.redirect('/admin'); 
});

router.post('/changePwd', (req, res) => {
	if(req.session.aid) {
		var sql = 'update admin set password = ? where id = ?';
		con.query(sql, [req.body.nPwd, req.session.aid], (err, result) => {
			if (err) throw err;
			else
				res.render('changePwd', { layout: 'layouts/adminLayout', msg: 'Password changed successfully' });
		});
	}
	else
		res.redirect('/admin'); 	
});

router.get('/logout', (req, res) => {
	if (req.session.aid) 
		req.session.destroy();
	res.redirect('/admin');
});

module.exports = router;
