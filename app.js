var express = require('express')
var app = express();
var bodyParser = require('body-parser')
var mongoose = require('mongoose')
var CG = require('./models/campground.js')
var Comment = require('./models/comments.js')
var User = require('./models/users.js')
var passport = require('passport');
var passportLocal = require('passport-local');
var methodOverride = require('method-override');
var expressSession = require('express-session');
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'));

//EXPRESS SESSION
app.use(expressSession({
    secret: "Doofenshmirtz Evil Incorporated",
    saveUninitialized: false,
    resave: false
}))

//PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Connecting to Atlas Database
mongoose.connect('mongodb+srv://vrajdugar:Prasad@1101@todocluster-r2fqe.mongodb.net/Yelp?retryWrites=true', {
    useNewUrlParser: true,
    useCreateIndex: true
});

//TO MAKE SOME VARIABLE AVAILABLE AS MIDDLEWARE EVERYWHERE
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
})

app.get('/', function (req, res) {
    res.redirect('/camps')
})

//INDEX PAGE (GET)
app.get('/camps', function (req, res) {
    CG.find({}, function (err, camps) {
        res.render('index', {
            camps: camps,
            currentUser: req.user
        });
    })
});

//NEW CAMP FORM (GET)
app.get('/camps/new', isLoggedIn, function (req, res) {
    res.render('newCamp', {
        error: ""
    })
})

//CREATE CAMP (POST)
app.post('/camps', isLoggedIn, function (req, res) {
    if (req.body.camp.name == "") {
        res.render("newCamp", {
            error: "<strong>X  Error! </strong> Name not entered."
        })
    } else {
        req.body.camp.author = {
            id: req.user._id,
            username: req.user.username
        };
        CG.create(req.body.camp, function (err, camp) {
            if (err) {
                res.render('newCamp')
            } else {
                res.redirect('/camps')
            }
        })
    }
});

//SHOW CAMP DETAILS (GET)
app.get('/camps/:id', function (req, res) {
    CG.findById(req.params.id).populate('comments').exec(function (err, camp) {
        res.render('showCamp', {
            camp: camp
        })
    })
})

//EDIT CAMP FORM (GET)
app.get('/camps/:id/edit', function (req, res) {
    CG.findById(req.params.id, function (err, camp) {
        if (camp.author.username == req.user.username) {
            res.render("editCamp", {
                camp: camp,
                error: ""
            })
        } else {
            res.redirect('/camps/' + req.params.id);
        }
    })
})

//UPDATE CAMP (PUT)
app.put('/camps/:id', function (req, res) {
    if (req.body.camp.name == "") {
        res.render("editCamp", {
            camp: req.body.camp,
            error: "<strong>X   Error! </strong> Name not entered."
        })
    } else {
        CG.findById(req.params.id, function (err, camp) {
            if (camp.author.username == req.user.username) {
                CG.findOneAndUpdate({
                    _id: req.params.id
                }, req.body.camp, function (err, camp) {
                    res.redirect('/camps/' + req.params.id)
                })
            } else {
                res.redirect('/camps/' + req.params.id);
            }
        })
    }
})

//DESTROY CAMP (DELETE)
app.delete('/camps/:id', function (req, res) {
    CG.findById(req.params.id, function (err, camp) {
        if (camp.author.username == req.user.username) {
            CG.findOneAndDelete({
                _id: req.params.id
            }, function (err, camp) {
                res.redirect('/camps')
            })
        } else {
            res.redirect('/camps/' + req.params.id);
        }
    })
})

// ==========================================
// COMMENT ROUTES
// ===========================================
app.get('/camps/:id/comments/new', isLoggedIn, function (req, res) {
    CG.findById(req.params.id, function (err, camp) {
        res.render('newComment', {
            camp: camp,
            error: ''
        })
    })
})

app.post('/camps/:id/comments', isLoggedIn, function (req, res) {
    CG.findById(req.params.id, function (err, camp) {
        req.body.comment.author = req.user.username;
        Comment.create(req.body.comment, function (err, comment) {
            comment.author.id = req.user._id;
            comment.author.username = req.user.username;
            comment.save();
            camp.comments.push(comment);
            camp.save();
            res.redirect('/camps/' + req.params.id);
        })
    })
})

app.get("/camps/:campid/comments/:commentid", function (req, res) {
    CG.findById(req.params.campid, function (err, camp) {

        Comment.findById(req.params.commentid, function (err, comment) {
            if (comment.author.username == req.user.username) {
                // camp.comments.splice(comment,1);
                // camp.save();
                Comment.findOneAndDelete({
                    _id: req.params.commentid
                }, function (err, comm) {
                    res.redirect('/camps/' + req.params.campid)
                })
            } else {
                res.redirect('/camps/' + req.params.campid);
            }
        })

    })

})

// ======================================
// AUTH ROUTES
// ======================================
//-----------REGISTER-------------------
app.get('/register', function (req, res) {
    res.render('register');
})

app.post('/register', function (req, res) {
    User.register(new User({
        username: req.body.username
    }), req.body.password, function (err, user) {
        if (err) {
            return res.redirect('/register')
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/camps');
        })
    })
})

//-----------LOGIN-------------------
app.get('/login', function (req, res) {
    res.render('login');
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/camps',
    failureRedirect: '/login'
}), function (req, res) {

})

//-----------LOGOUT-------------------
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/camps')
})


//MIDDLEWARE

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}
app.listen(process.env.PORT||3001, function () {
    console.log('Yelp is up and running on 3001!')
})