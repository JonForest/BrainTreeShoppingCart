/* global require */
'use strict';

var ShoppingCart = require('./modules/shopping_cart.js');
var cartSchema = require('./schemas/cart_schema');
let productSchema = require('./schemas/product_schema');
let discountCodeSchema = require('./schemas/discount_code_schema');
let paymentAttemptSchema = require('./schemas/discount_code_schema');
let mongoose = require('mongoose');
let logger = require('./utils/logger');

var Payments = function(db) {

    // Initialise schemas for the module
    db.model('Cart', cartSchema);
    db.model('Product', productSchema);
    db.model('DiscountCode', discountCodeSchema);
    db.model('PaymentAttempt', paymentAttemptSchema);

    let Cart = db.model('Cart');
    let Product = db.model('Product');


    /**
     * Create a new instance of the cart.
     * If there is an existing open instance, and there shouldn't be really, then delete that and return
     * @param {Object} project
     * @param {Function) done
     */
    function createNewCart(refId, done) {
        Cart.findOne({reference: refId, status: 'open'}, function(err, existingCart) {
            if (err) {
                logger.error('createNewCart, Cart.findOne method failed with error: ' + err.message);
            }
            if (existingCart) {
                //There is an existing open, cart document, so abandon it
                //a new cart document as part of that process)
                existingCart.status = 'abandoned';
                existingCart.save(function (err) {
                    if (err) {
                        logger.error('createNewCart, save existingCar failed with error: ' + err.message);
                    }
                    returnNewCart(refId, done);
                });
            } else {
                returnNewCart(refId, done);
            }
        });
    }

    /**
     * @private
     * @param {string} refId
     * @param {Function} done
     */
    function returnNewCart(refId, done) {
        let cart = new Cart({reference: mongoose.Types.ObjectId(refId)});
        cart.save(function() {
            done(
                null,
                new ShoppingCart(db, cart)
            )
        });

    }

    function getExistingCart(refId, done) {
        Cart.findOne({reference: refId, status: 'open'}, function(err, existingCart) {
            if (err) {
                //TODO: Log an error here
            }
            if (existingCart) {
                done(null, new ShoppingCart(db, existingCart));
            } else {
                done(null, null);
            }
        });
    }

    //Expose certain functions publically
    return {
        createNewCart : createNewCart,
        getExistingCart: getExistingCart
    }

};
module.exports = Payments;