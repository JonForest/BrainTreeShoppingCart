/* global module */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paymentAttemptSchema = new Schema({
    // Required to make the attempt
    cart: { type: Schema.Types.ObjectId, ref: 'Cart', required: true },
    amount: {type: Number, required: true},
    nonce: {type: String, required: true},
    dateOfAttempt: {type: Date, required: true},

    // Result of attempt
    result: {type: Object},
    success: {type: Boolean},
    message: {type: String}

});

module.exports = paymentAttemptSchema;
