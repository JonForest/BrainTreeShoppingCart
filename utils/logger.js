'use strict';

var winston = require('winston');
require('winston-mongodb').MongoDB;

var logger = function() {
    var dbURI = process.env.MONGOLAB_URI || 'mongodb://localhost/inkub8';//'mongodb://heroku_app31705663:ul2dgf5mdd6uc28kq7a5nk1s0e@ds053320.mongolab.com:53320/heroku_app31705663';
    winston.add(winston.transports.MongoDB, {dbUri: dbURI});
    winston.remove(winston.transports.Console);
    return winston;
}();


module.exports = logger;

