/* global module */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    name: {type: String, required: true},
    tag: {type:String, required:true},
    rrp: {type: Number, required: true},
    currencyCode: {type: String, required: true},
    status: {type: String, enum: [ 'live', 'deleted' ], default: 'live'},
    createdAt: {type: Date, default: Date.now }
});



module.exports = productSchema;
