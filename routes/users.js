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
	if (req.session.uid) {
		var sql = "select * from account where customer_id = ?";
		con.query(sql, [req.session.uid], (err, result) => {
			if (err)
				throw err;
			else
				res.render('userHome', { layout: 'layouts/userLayout', accounts: result });
		});
	}
	else
		res.redirect('/users');
});

router.get('/logout', (req, res) => {
	if (req.session.uid) 
		req.session.destroy();
	res.redirect('/users');
});

module.exports = router; 