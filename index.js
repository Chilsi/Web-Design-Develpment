// import dependencies
const express = require('express');
const req = require('express/lib/request');
const path = require('path');
const myApp = express();
const session = require('express-session');

// Setup DB Connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://0.0.0.0:27017/awesomestore', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
});

// Setup Database Model
const Order = mongoose.model('order',{
    studentid: String,
    studentname : String, 
    mjuice : Number,
    bjuice : Number,
    ajuice : Number,
    subTotal : Number,
    tax : Number,
    total : Number
});

const Admin = mongoose.model('Admin', {
    aname: String,
    pass: String
});

// Setup Session
myApp.use(session({
    secret: "thisismyrandomkeysuperrandomsecret",
    resave: false,
    saveUninitialized: true
}));

// Express Validator
const {check, validationResult} = require ('express-validator');

// Express Body-Parser
myApp.use(express.urlencoded({extended:true}));

//Set path to public and views folder.
myApp.set('views', path.join(__dirname, 'views'));
myApp.use (express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//------------------- Validation Functions --------------------

var idRegex = /^[0-9]{3}\-?[0-9]{4}\-?$/; 
var positiveNumber = /^[0-9][0-9]*$/;

function checkRegex(userInput, regex)
{
    if (regex.test(userInput))
        return true;
    else   
        return false;
}

function customIdValidation(value)
{
    if (!checkRegex(value, idRegex))
    {
        throw new Error ('Please enter correct format: 123-1234 OR 1231234!');
    }
    return true;
}

function customQuantityValidation(value)
{
   
    if (!checkRegex(value, positiveNumber))
    {
        throw new Error ('Please enter valid quantity!');
    }
    
    return true;
}


// Setup different routes (pages)

myApp.get('/', function(req, res){
    res.render('form'); 
});

myApp.post('/', [
    check ('studentid', '').custom(customIdValidation),
    check ('studentname', 'Name is required!').notEmpty(),
    check ('mjuice', '').custom(customQuantityValidation),
    check ('bjuice', '').custom(customQuantityValidation),
    check ('ajuice', '').custom(customQuantityValidation)
],function(req, res){

    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty())
    {
        res.render('form', {errors : errors.array()});
    }

    else 
    {
        var studentid = req.body.studentid;
        var studentname = req.body.studentname;
        var mjuice = req.body.mjuice;
        var bjuice = req.body.bjuice;
        var ajuice = req.body.ajuice;
        
        var q1 = mjuice * 6.99;
        var q2 = bjuice * 5.99;
        var q3 = ajuice * 3.99;

        var subTotal = q1 + q2 + q3;
        var tax = subTotal * 0.13;
        var total = subTotal + tax;
        
        var pageData = {
            studentid : studentid,
            studentname : studentname,
            mjuice : mjuice,
            bjuice : bjuice,
            ajuice : ajuice,
            subTotal : subTotal,
            tax : tax,
            total : total}         
    };

    
    // Save the form data into Database
    var myOrder = new Order(pageData);
    myOrder.save().then(function() {
        console.log("New Order Created!");
    }).catch(function (x) {
        console.log(`Error: ${x}`);
    });

    res.render('form', pageData); 
});

// Allorders Page
myApp.get('/allorders', function(req, res){
    // If session exists, then access All Orders Page.
    if (req.session.userLoggedIn)
    {
        // Read documents from MongoDb
        Order.find({}).exec(function (err, ordersValue){
            console.log(`Error: ${err}`);
            console.log(`Orders Value:: ${ordersValue}`);
            res.render('allorders', {ordersKey: ordersValue}); 
        })
    }
    // Otherwise redirect user to login page.
    else
        res.redirect('/login');
    
});

// Login Page
myApp.get('/login', function(req, res){
    res.render('login');
});

// Login Page
myApp.post('/login', function(req,res) {
    var user = req.body.username;
    var pass = req.body.password;
    console.log(`Username is: ${user}`);
    console.log(`Password is: ${pass}`);

    Admin.findOne({username:user, password: pass}).exec(function(err, admin) {
        console.log(`Error is: ${err}`);
        console.log(`Admin is: ${admin}`);
        if (admin)
        {
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            res.redirect('/allorders');
        }
        else
        {
            res.render('login', {error: "Sorry login failed. Please try again!"});
        }
    });

});

// Logout Page
myApp.get('/logout', (req,res) => {
    // Remove Stored Session and redirect user to login page.
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', {error: 'Successfully logged out!'});
});


myApp.get('/delete/:id', (req,res) => {

    if (req.session.userLoggedIn)
    {
        // Delete record from MongoDb.
        var id = req.params.id;

        console.log(`Deleted Object Id: ${id}`);
        Order.findByIdAndDelete({_id : id}).exec(function(err, order) {
            console.log(`Error: ${err}`);
            console.log(`Order: ${order}`);
            if (order)
                res.render('delete', {message: "Deleted Successfully...!"});
            else
                res.render('delete', {message: "Sorry, Record Not Deleted...!"});
        });
    }
    // Redirect user to login page.
    else
        res.redirect('/login');
});

myApp.listen(8000);
console.log('Everything executed fine... Open http://localhost:8000/');