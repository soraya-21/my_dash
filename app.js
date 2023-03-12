// App.js

var express = require("express"),
	mongoose = require("mongoose"),
	passport = require("passport"),
	bodyParser = require("body-parser"),
	LocalStrategy = require("passport-local"),
	passportLocalMongoose =
		require("passport-local-mongoose")
const bcrypt = require('bcrypt');
const User = require("./model/User");
const uuid = require('uuid');
const nodemailer = require('nodemailer');
var app = express();


async function sendConfirmationEmail(to, token) {
	// Créer un compte de test nodemailer
	let testAccount = await nodemailer.createTestAccount();
  
	// Créer un transporteur SMTP avec Nodemailer
	let transporter = nodemailer.createTransport({
		service: 'gmail',
  		auth: {
			user: "sorayacodo4@gmail.com",
			pass: "xzugqdgjygxfhxbj"
	  	},
	});
	
	// Envoyer l'email de confirmation
	let info = await transporter.sendMail({
		from: 'Soraya <noreply@example.com>',
		to: to,
		subject: 'Confirmation de votre compte',
		html: `Veuillez cliquer sur ce lien pour confirmer votre compte: <a href="http://localhost:3000/confirm?token=${token}">Confirmer</a>`
	});
  
	console.log('Message sent: %s', to);
}

mongoose.connect("mongodb+srv://sorayacodo:dashboardpassword@cluster0.rjnjr1g.mongodb.net/?retryWrites=true&w=majority");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require("express-session")({
	secret: "Rusty is a dog",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
	res.render("home");
});

// Showing secret page
app.get("/secret", isLoggedIn, function (req, res) {
	res.render("secret");
});

// Showing register form
app.get("/register", function (req, res) {
	res.render("register");
});

// Handling user signup
app.post("/register", async (req, res) => {
	try {
		// Vérifier si l'utilisateur existe déjà
		const existingUser = await User.findOne({ email: req.body.email });
		if (existingUser) {
		  return res.status(400).json({ error: 'Account already exists' });
		}
	
		// Générer le hash du mot de passe
		const saltRounds = 10; // Le nombre de tours de hachage à effectuer
		const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
	
		// Générer un jeton unique pour l'utilisateur
		const token = uuid.v4();
	
		// Créer l'utilisateur avec le mot de passe hashé et le jeton de confirmation
		const user = await User.create({
		  email: req.body.email,
		  username: req.body.username,
		  password: hashedPassword,
		  confirmed: false,
		  confirmationToken: token
		});

		// Envoyer l'email de confirmation
		await sendConfirmationEmail(user.email, token);

		// Renvoyer une réponse réussie
		return res.redirect("login");
	} catch (error) {
	// Renvoyer une réponse d'erreur si nécessaire
	return res.status(500).json({ error });
	}
});
	
// Route pour la confirmation d'email
app.get('/confirm', async (req, res) => {
	try {
	// Trouver l'utilisateur avec le jeton de confirmation
	const user = await User.findOne({ confirmationToken: req.query.token });
	if (!user) {
		return res.status(400).json({ error: 'Invalid token' });
	}

	// Mettre à jour le champ "confirmed" de l'utilisateur et supprimer le jeton de confirmation
	user.confirmed = true;
	user.confirmationToken = undefined;
	await user.save();

	// Renvoyer une réponse réussie
	return res.status(200).json({ message: 'Account confirmed' });
	} catch (error) {
	// Renvoyer une réponse d'erreur si nécessaire
	return res.status(500).json({ error });
	}
});

//Showing login form
app.get("/login", function (req, res) {
	res.render("login");
});

//Handling user login
app.post("/login", async function(req, res){
	try {
		const user = await User.findOne({ email: req.body.email });
		if (user) {
		  if (!user.confirmed) {
			return res.status(400).json({
			  error: "Pending Account. Please Verify Your Email!",
			});
		  }
		  const result = await bcrypt.compare(req.body.password, user.password);
		  if (result) {
			return res.render('secret');
		  } else {
			return res.status(400).json({ error: "Password doesn't match" });
		  }
		}
		return res.status(400).json({ error: "User doesn't exist" });
	  	} catch (error) {
		
			return res.status(400).json({ error });
	}
});

//Handling user logout
app.get("/logout", function (req, res) {
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});



function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.log("Server Has Started!");
});
