const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cons = require('consolidate');
const db = require('./config/db.json');
const axios = require("axios");
const userData = require('./config/MOCK_DATA.json');
const fs = require('fs');
Nexmo = require('nexmo');


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs');

app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Your Hash: 73458b464d89b491764f3dc9cc9bf5ee (md5)
//Your String: myhqtestauth_1532798359353

app.get('/', (req, res) => {
    res.render("index");
});
app.get('/login', auth, (req, res) => {
    res.render("login");
});
app.get('/dashboard', auth, (req, res) => {
    res.render("dashboard", {
        userData: userData
    });

});
app.get('/userinfo/:id', auth, (req, res) => {
    const result = userData.filter(user => user.id == req.params.id);
    res.render("userInfo", {
        user: result[0]
    });
});

app.post('/sendsms', auth, (req, res) => {
    try {
        let otptext = req.body.otptext;
        let createdAt = +new Date();
        let phone = req.body.phone;
        let result = userData.filter(user => user.phone == req.body.phone);
        result[0]["otptext"] = otptext || "";
        result[0]["createdAt"] = createdAt;
        let arr = [];
        fs.readFile('./messagelist.json', 'utf8', function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                let obj = data != "" ? JSON.parse(data) : [];
                obj.push(result[0]);
                json = JSON.stringify(obj);
                fs.writeFile('./messagelist.json', json, 'utf8', function(err) {
                    res.redirect("/messagelist");
                });
            }
        });

    } catch (e) {
        console.log(e);
    }

});
app.get('/messagelist', auth, (req, res) => {
    fs.readFile('./messagelist.json', 'utf8', function(err, messageData) {
        res.render("messagelist", {
            messageData: JSON.parse(messageData).reverse()
        });
    });
});

app.get('/sendsms/:id', auth, (req, res) => {
    const result = userData.filter(user => user.id == req.params.id);
    let otp = Math.floor(100000 + Math.random() * 900000);
    let msg = `Dear ${result[0].first_name} Use OTP :${otp} to login your account.`;
    sendOtp(["919958692471"], msg);
    res.render("sendsms", {
        phone: result[0].phone,
        otpMsg: msg
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie("authToken");
    res.redirect("/");
});

app.get('/sendOtp', sendTestOtp);
app.get('/sendOtpmsg91', sendTestOtpmsg91);

// signin onthe basis of Email and password which is now static
app.post('/signin', function(req, res) {
    if (req.body.email == db.email && req.body.password == db.password) {
        res.cookie('authToken', db.auth_token, {
            maxAge: 900000,
            httpOnly: true
        });
        res.redirect("dashboard");
    } else {
        res.redirect("login");
    }
});
app.get('*', (req, res) => {
    res.render('error');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

//auth handler

function auth(req, res, next) {
    let cookie = req.cookies.authToken;
    if (cookie === undefined || cookie != db.auth_token) {
        if (req.url == "/login") {
            res.render("login");
        } else {
            res.redirect("/login");
        }
    } else {
        next();
    }
};

function sendTestOtp(req, res, next) {

    try {
        var Nexmo = require('nexmo');

        var nexmo = new Nexmo({
            apiKey: "8b47fa0e",
            apiSecret: "gyn9N3dr47muHags"
        });
        nexmo.message.sendSms("Acme Inc", "919958692471", "hello", {}, (err, response) => {
            res.send(response);
        });
    } catch (e) {
        console.log(e);
    }
};

function sendTestOtpmsg91(req, res, next) {

    try {
      let apiKey = '229824AvE7LS7DNzx5b64a067';
      let msg91 = require("msg91")(apiKey, "MSGIND", "106" );
      msg91.send(["919958692471"], "Hey Nitin here I am going to add otp functionallity in that.", function(err, response){
          console.log(err);
          console.log(response);
          res.send(response);
      });

    } catch (e) {
        console.log(e);
    }
};

function sendOtp(reciever, otpText) {
    try {
      let apiKey = '229824AvE7LS7DNzx5b64a067';
      let msg91 = require("msg91")(apiKey, "MSGIND", "106" );
      msg91.send(reciever, otpText, function(err, response){
          console.log(err);
          console.log(response);
      });

    } catch (e) {
        console.log(e);
    }
};




// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
