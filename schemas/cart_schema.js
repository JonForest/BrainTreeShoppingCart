/* global module */
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var cartSchema = new Schema({
    /* amount: Number, - will be a psuedo element */
    project: { type: Schema.Types.ObjectId, required: true },
    discountCode: { type: Schema.Types.ObjectId, ref: 'DiscountCode'},
    currency: {type: String, enum: ['NZD'], default: 'NZD'},
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        cost: {type: Number} //Store a copy of the price at time of purchase
    }],
    status: {type: String, enum: [
        'open',
        'paid',
        'abandoned'
    ], default: 'open'},
    totalToPay: Number,
    createdAt: {type: Date, default: Date.now },
    updatedAt: {type: Date, default: Date.now }

});


cartSchema.set('toJSON', { getters: true });
cartSchema.set('toObject', { getters: true });
cartSchema.virtual('totalCartCost').get(function () {
    return this.products.reduce((totalCost, product) => totalCost + product.cost, 0);
});

cartSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});
cartSchema.pre('update', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = cartSchema;

