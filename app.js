const express  =  require('express');
const app = express();
const mongoose =  require("mongoose");
const passport =  require("passport");
const bodyParser =  require("body-parser");
// we're calling in the mongoose schema user
const User = require("./models/user");
const Post = require("./models/post");
app.use(express.static(__dirname + '/public'));
//we're setting up the strategy to provide security
const LocalStrategy =  require("passport-local");


const passportLocalMongoose =  require("passport-local-mongoose"); ////simplifies the integration between Mongoose and Passport for local authentication
const twig = require('twig');

// views
app.set('view engine', 'html');
app.engine('html', twig.__express);
app.set('views','views');

const mongourl = 'mongodb+srv://test:Password@cluster0.7bulh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';


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

// get our views set up
app.get("/", (req,res) =>{
    res.render("home", { user: req.user })
})
app.get("/login", (req,res) =>{
    res.render("login")
})
app.get("/register", (req,res) =>{
    res.render("register")
})



// set up the functionality for registering a new user

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

// adding a comment
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

//display comments 

app.get('/dashboard', (req, res) => {
    // FETCH ALL POSTS FROM DATABASE
    Post.find()
    // sort by most recent
    .sort({createdAt: 'descending'})
    .then(result => {
        if(result){
            // RENDERING HOME VIEW WITH ALL POSTS
            res.render('dashboard',{
                allpost:result

            });
        }
    })
    .catch(err => {
        if (err) throw err;
    }); 
});


// delete func
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

// set up the functionality for logging in an existing user

app.post("/login", passport.authenticate("local",{
        successRedirect:"/dashboard",
        failureRedirect:"/login"
    })
);

// logout functionality 

app.get("/logout",(req,res)=>{  // logout function
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) 
                return next();
            res.redirect('/');     
}

// stop users from seeing the dashboard if they haven't logged in
app.get("/dashboard", isLoggedIn,(req,res) =>{
	res.render('dashboard.html', { user: req.user })
})

