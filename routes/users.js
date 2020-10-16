var express = require('express');
var router = express.Router();

const con = require('../models/Db');

router.get('/', (req, res) => {
	res.render('userLogin');
});

router.post('/checkLogin', (req, res) => {
	var email = req.body.uid;
	var sql = 'select * from customer where email = ? and password = ?';
	con.query(sql, [email, req.body.password], (err, result) => {
		if (err)
			throw err;
		else if (result.length > 0) {
			req.session.uid = result[0].id; 
			res.redirect('/users/home');
		}
		else
			res.render('userLogin', { msg: 'Login Fail' });
	});
});

router.get('/home', (req, res) => {
	if (req.session.uid)
		res.render('userHome', { layout: 'layouts/userLayout' });
	else
		res.redirect('/users');
});

//Ajax call from viewAcount
router.get('/getMonthRows', (req, res) => {
	if (req.session.uid) {
		if (req.query.filter == 'none') {
			var sql = 'select customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
					+ 'from account, customer, plan '
					+ 'where account.customer_id = customer.id and account.plan_id = plan.id '
					+ 'and customer_id = ?';
			con.query(sql, [req.session.uid], (err, result) => {
				if (err) throw err;
				else 
					res.send(result);
			});
		}
		else if (req.query.filter == 'currentMonth') {
			var sql = 'select customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
					+ 'from account, customer, plan '
					+ 'where month(expiry_date) = month(current_date()) and year(expiry_date) = year(current_date()) '
					+ 'and account.customer_id = customer.id and account.plan_id = plan.id '
					+ 'and customer_id = ?';
			con.query(sql, [req.session.uid], (err, result) => {
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
						var sql = 'select customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
						+ 'from account, customer, plan '
						+ 'where month(expiry_date) in (month(current_date()), month(current_date()) + 1, month(current_date()) + 2, month(current_date()) + 3, month(current_date()) + 4) '
						+ 'and year(expiry_date) = year(current_date()) '
						+ 'and account.customer_id = customer.id and account.plan_id = plan.id '
						+ 'and customer_id = ?';
						con.query(sql, [req.session.uid], (err, result) => {
							if (err) throw err;
							else 
								res.send(result);
						});
					} else {
						var sql = 'select  customer.name as cname, domain_name, plan.name, domain_taken, register_date, time_period, expiry_date, domain_charges, charges, total_charges '
						+ 'from account, customer, plan '
						+ 'where month(expiry_date) in (?) and year(expiry_date) in (year(current_date()), year(current_date())+1) '
						+ 'and account.customer_id = customer.id and account.plan_id = plan.id '
						+ 'and customer_id = ?';
						var monthArr = [];
						var month = currentDateMonth;
						for (var i = 1; i < 6; i++) {
							monthArr.push(month);
							if (month == 12)
								month = 1;
							else
								month++;
						}
						con.query(sql, [monthArr, req.session.uid], (err, result) => {
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
		res.redirect('/');	
});

router.get('/changePwd', (req, res) => {
	if (req.session.uid) {	
		res.render('changePwd', { layout: 'layouts/userLayout' });
	} else
		res.redirect('/');
});

router.get('/checkCurrentPassword', (req, res) => {
	if (req.session.uid) {
		var sql = 'select * from customer where id = ? and password = ?';
		con.query(sql, [req.session.uid, req.query.cPwd], (err, result) => {
			if (err) throw err;
			else if (result.length > 0) {
				console.log('inside else if');
				console.log(result);
				res.send({ msg: 'Correct' });
			}
			else {
				console.log('inside else');
				console.log(result);
				res.send({ msg: 'Incorrect' });
			}
		});
	}
	else
		res.redirect('/'); 
});

router.post('/changePwd', (req, res) => {
	if(req.session.uid) {
		var sql = 'update customer set password = ? where id = ?';
		con.query(sql, [req.body.nPwd, req.session.uid], (err, result) => {
			if (err) throw err;
			else
				res.render('changePwd', { layout: 'layouts/userLayout', msg: 'Password changed successfully' });
		});
	}
	else
		res.redirect('/'); 	
});
router.get('/logout', (req, res) => {
	if (req.session.uid) 
		req.session.destroy();
	res.redirect('/users');
});

module.exports = router; 