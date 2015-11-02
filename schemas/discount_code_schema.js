/* global module, require */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var discountCodeSchema = new Schema({
    description: {type: String, required: true},
    code: {type:String, required:true},
    discountPercentage: {type:Number, max:100, min: 0},
    status: {type: String, enum: [
        'valid',
        'closed'
    ], default: 'valid'},
    startDate: {type: Date},
    endDate: {type: Date}, //TODO: Create validation that doesn't allow an endDate before a startDate http://stackoverflow.com/a/29416193/403264
    createdAt: {type: Date, default: Date.now }
});

module.exports = discountCodeSchema;