'use strict';

var winston = require('winston');
require('winston-mongodb').MongoDB;

var Logger = function() {
    const dbUri = process.env.MONGOLAB_URI || 'mongodb://localhost/inkub8';
    return new (winston.Logger)({
        transports: [
            new (winston.transports.MongoDB)({db: dbUri})
        ]
    });
}();


module.exports = Logger;

