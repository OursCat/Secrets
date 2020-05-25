//Same boilerplate for all the projects
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs')
const bodyParser = require('body-parser')
const app = express();
//oauth with google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
//oauth with facebook
const FacebookStrategy = require('passport-facebook').Strategy;

//Use passport to help with l5 and l6 authentication,needed dependencies(passport,passport-local,passport-local-mongoose,express-session).
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');

//app.use setups
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());

//set up passport 
//step 1 of setting up passport:use express-session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));
//step 2 of setting up passport:initialize passport
app.use(passport.initialize());
//step 3 of setting up passport:use passport to manage session
app.use(passport.session());

//step 1 connect to the mongodb
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
mongoose.connect('mongodb://localhost:27017/secretDb', options);
mongoose.set('useCreateIndex', true)
//step 2 creat a data structure

const Schema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});
//step 4 of setting up passport:use plugin passportLocalMongoose to help with hashing passwords
Schema.plugin(passportLocalMongoose);
Schema.plugin(findOrCreate);

const ContentSchema = new mongoose.Schema({
    words: String
});
//step 3 use Schema to create a mongoose model
const User = mongoose.model('secret', Schema);
const Content = mongoose.model('content', ContentSchema);

//step 4 of setting up passport:create strategy
passport.use(User.createStrategy());
//step 5 of setting up passport:SerializeUser and deserializeUser the user
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
//oauth with google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5500/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

//oauth with facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:5500/auth/facebook/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

/////all the configurations done here
/////all the configurations done here
/////all the configurations done here

app.get('/', function (req, res) {
    res.render('pages/home');
});

app.post('/',
    passport.authenticate('local', {
        successRedirect: '/secret',
        failureRedirect: '/invalid'
    }),
);


app.get('/register', function (req, res) {
    res.render('pages/register');
});

app.post('/register', function (req, res) {
    //Passport method to insert data into mongodb
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.send(err.message)
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secret');
            });
        }
    })
});

app.get('/secret', function (req, res) {
    if (req.isAuthenticated()) {
        Content.find(function (err, stuff) {
            res.render('pages/secret', { s: stuff });
        });
    } else {
        res.redirect("/invalid")
    }
});


app.get('/compose', function (req, res) {
    res.render('pages/compose');
});

app.post('/compose', function (req, res) {
    let content = req.body.compose;
    let compose = new Content({
        words: content
    });
    compose.save();
    res.redirect('/secret');
});

app.get('/logoff', function (req, res) {
    req.logout();
    res.redirect('/')
});

app.get('/invalid', function (req, res) {
    res.render('pages/invalid');
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }
    ));
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/secret');
    });
app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['profile'] }
    ));
app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/secret');
    });

app.listen(process.env.PORT || 5500, function () {
    console.log('server is running at port 5500')
});
