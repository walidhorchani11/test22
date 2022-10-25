var express = require('express');
const userRoute = require('./user');
const transactionRoute = require('./transaction');
const app = express();

app.use('/user', userRoute);
app.use('/transaction', transactionRoute);


module.exports = app;
