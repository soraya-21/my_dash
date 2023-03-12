// User.js

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var User = new Schema({
	email: {
		type: String
	},
	username: {
		type: String
	},
	password: {
		type: String
	},
	confirmed: {
		type: Boolean,
		default: false
	},
	confirmationToken: { 
		type: String, 
		unique: true 
	},
})

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User)
