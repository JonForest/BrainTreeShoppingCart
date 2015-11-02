/* global module, require */
'use strict';

const async = require('async');
const logger = require('../utils/logger');
const BrainTreePayments = require('./braintree_payments.js');


const ShoppingCart = function(db, cart) {
    //TODO: Doc blocks
    let Product = db.model('Product');
    let Cart = db.model('Cart');
    let DiscountCode = db.model('DiscountCode');

    /**
     *
     * @param {string} productTag
     * @param {Function} done
     */
    this.addProduct = (productTag, done) => {
        // If no items were passed in, then exit
        if (!productTag) {
            done(new Error('Failed as no product provided to add to the cart'), null);
            return;
        }

        //We have some items, add each one to the cart
        getProductAndRRP(productTag, function(err, product) {
            if (err) {
                done(new Error('Failed to add the product to the cart'), null);
            } else {
                cart.products.push(product);
                calculateTotalCost(cart, done)
            }
        });

    }

    this.removeProduct = () => {
        //TODO: Placeholder.  No option to remove items from the cart in this version
    };

    this.makePaymentAttempt = () => {
        //TODO: Do this soon
    };

    /**
     *
     * @param {string} itemTag
     * @param {Function} done
     */
    function getProductAndRRP(itemTag, done) {
        //Get the product
        Product.findOne({tag: itemTag, status: 'live'}, function(err, product) {
            if (err) {
                logger.error('ShoppingCart:getProductAndRRP - findOne method.  Failed with "productTag": ' + itemTag + '  With error: ' + err.message);
                done(err, null);
            } else if (!product) {
                done(new Error('Product not found'), null);
            } else {
                done(null, {
                    product: product,
                    cost: product.rrp
                });
            }
        });
    }


    /**
     * Applies a discount to the cart assuming the discount code is valid (has status 'valid' and is in date)
     * @param {string} discountCodeString
     * @param {Function} done
     */
    this.applyDiscountCode = (discountCodeString, done) => {
        // Look up the discount code
        let today = new Date();
        DiscountCode.findOne(
            {code: discountCodeString, status: 'valid', startDate: {$lt: today}, endDate: {$gt: today}},
            function(err, discountCode) {
                if (err) {
                    logger.error('ShoppingCart:applyDiscountCode - findOne method.  Failed with "discountCode": ' + discountCodeString + '  With error: ' + err.message);
                    done(err, null);
                } else if (!discountCode) {
                    done(null, cart);
                } else {
                    cart.discountCode = discountCode;
                    cart.totalToPay = (cart.totalCartCost/100) * cart.discountCode.discountPercentage;
                    cart.save(function () {
                        done(null, cart);
                    })
                }
            }
        )
    };

    this.getCart = () => cart;

    /**
     * Used to calculate the cost of the cart on-demand.  Used internally at the moment after adding a new product.
     * @private
     * @param {Object} cart
     * @param {Function} done
     */
    function calculateTotalCost(cart, done) {
        // Need to populate the discount code to understand the discount
        //TOOD: Maybe need to populate cart somewhere before this  Not usre what is going?
        // Populate it
        cart.populate('discountCode products.product', function() {
            if (cart.discountCode) {
                cart.totalToPay = (cart.totalCartCost / 100) * cart.discountCode.discountPercentage;
             } else {
                cart.totalToPay = cart.totalCartCost;
            }
            cart.save(done); //Callback receives (err, cart, numAffected) arguments
        });
    }

    this.getPaymentClientToken = (done) => {
        const brainTreePayments = new BrainTreePayments(db, cart);
        brainTreePayments.getClientToken(done);
    };

    //return {
    //    addProduct: addProduct,
    //    removeProduct: removeProduct,
    //    applyDiscountCode: applyDiscountCode,
    //    getPaymentClientToken: getPaymentClientToken,
    //    makePaymentAttempt : makePaymentAttempt,
    //    getCart: getCart
    //}
};

module.exports = ShoppingCart;