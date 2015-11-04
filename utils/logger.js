'use strict';

var winston = require('winston');
require('winston-mongodb').MongoDB;

var Logger = function(dbUri, app) {
    return new (winston.Logger)({
        transports: [
            new (winston.transports.MongoDB)({dbUri: dbUri})
        ]
    });
};


module.exports = Logger;

