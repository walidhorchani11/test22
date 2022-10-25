const mongoose = require("mongoose");
mongoose.Promise = global.Promise;



const db = {};

db.mongoose = mongoose;

db.user = require("./user");
db.transaction = require("./transaction");
module.exports = db;
