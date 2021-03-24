//NPM packages
const express  =  require('express');
const mongoose =  require("mongoose");
const passport =  require("passport");
const bodyParser =  require("body-parser");
const twig = require('twig');
 // Declaring our app
const app = express();

// we're calling in the mongoose schema user
const User = require("./models/user");
const Post = require("./models/post");

//we're setting up the strategy to provide security
const LocalStrategy =  require("passport-local");


const passportLocalMongoose =  require("passport-local-mongoose"); ////simplifies the integration between Mongoose and Passport for local authentication


// set the view engine
app.set('view engine', 'html');
app.engine('html', twig.__express);
app.set('views','views');

// declease a variable which stores our Mongo database URL
const mongourl = 'mongodb+srv://test:Password@cluster0.7bulh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

//make the public accessible to our backend application (images,styling)
app.use(express.static(__dirname + '/public'));


mongoose.connect(mongourl, { useUnifiedTopology: true });


app.use(require("express-session")({
    secret:"any normal word", //decode or encode session, this is used to compute the hash.
    resave: false,              //What this does is tell the session store that a particular session is still active, in the browser
    saveUninitialized:false    //the session cookie will not be set on the browser unless the session is modified
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 
passport.use(new LocalStrategy(User.authenticate()));

// add the bodyParser so we can return our information to the database
app.use(bodyParser.urlencoded({ extended:true }))
app.use(passport.initialize());
app.use(passport.session());


// start our server
const port = 3000;
app.listen(port ,function (err) {
    if(err){
        console.log(err);
    }else {
        console.log("Server Started At Port " + port);
    } 
});


//
app.get("/login", (req,res) =>{
    res.render("login")
})
app.get("/register", (req,res) =>{
    res.render("register")
})
app.get("/edit", (req,res) =>{
    res.render("edit")
})



// REGISTER A NEW USER
app.post("/register",(req,res)=>{ 
    User.register(new User({            //passport-local-mongoose function to register a new user
    	username: req.body.username,
    	email:req.body.email,
    	}),
    	req.body.password,function(err,user){
        if(err){
            console.log(err);
        }
        passport.authenticate("local")(req,res,function(){ // authenticate the local session and redirect to login page
            console.log(req);
            res.redirect("/login");
        })    
    })

});

// ADDING COMMENTS
app.post('/dashboard', (req, res) => {
    new Post({
        title:req.body.title,
        content:req.body.content,
        author_name:req.body.author,
        image_url:req.body.image_url
    })
    .save()
    .then(result => {
        console.log(result);
        res.redirect('/dashboard');
    })
    .catch(err => {
        if (err) throw err;
    });
});

// DISPLAY COMMENTS
app.get('/dashboard', isLoggedIn, (req, res) => {
    // FETCH ALL POSTS FROM DATABASE
    Post.find()
    // sort by most recent
    .sort({createdAt: 'descending'})
    .then(result => {
        if(result){
            // RENDERING HOME VIEW WITH ALL POSTS
            res.render('dashboard',{
                allpost:result,
                user: req.user
            });
        }
    })
    .catch(err => {
        if (err) throw err;
    }); 
});


app.get('/', (req, res) => {
    // FETCH ALL POSTS FROM DATABASE
    console.log('return post')
    Post.find()
    // sort by most recent
    .sort({createdAt: 'descending'})
    .then(result => {
        if(result){
            // RENDERING HOME VIEW WITH ALL POSTS
            res.render('home',{
                allpost:result
            });
        }
    })
    .catch(err => {
        if (err) throw err;
    }); 
});

// DELETE COMMENTS
app.get('/delete/:id', (req, res) => {
    Post.findByIdAndDelete(req.params.id)
    .then(result => {
        res.redirect('/dashboard');
    })
    .catch(err => {
        console.log(err);
        res.redirect('/dashboard');
    })
});

// UPDATE POST
app.get('/edit/:id', (req, res) => {
    Post.findById(req.params.id)
    .then(result => {
        if(result){
            res.render('edit',{
                post:result
            });
        }
        else{
            res.redirect('/');
        }
    })
    .catch(err => {
        res.redirect('/');
    });
});
// UPDATE POST
app.post('/edit/:id', (req, res) => {
    Post.findById(req.params.id)
    .then(result => {
        if(result){
            result.title = req.body.title;
            result.content = req.body.content;
            result.author_name = req.body.author;
            return result.save();
        }
        else{
            console.log(err);
            res.redirect('/');
        }
    })
    .then(update => {
        res.redirect('/dashboard');
    })
    .catch(err => {
        res.redirect('/');
    });
});

// set up the functionality for logging in an existing user
app.post("/login", passport.authenticate("local",{
        successRedirect:"/dashboard",
        failureRedirect:"/login"
    })
);

// LOGOUT 
app.get("/logout",(req,res)=>{  // logout function
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) 
                return next();
            res.redirect('/');     
}


