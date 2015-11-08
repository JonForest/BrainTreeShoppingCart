/* global module, require */
'use strict';

const async = require('async');
const logger = require('../utils/logger');
const braintree = require("braintree");

const gateway = braintree.connect({
    environment: braintree.Environment[process.env.BT_ENVIRONMENT],
    merchantId: process.env.BT_MERCHANTID,
    publicKey: process.env.BT_PUBLICKEY,
    privateKey: process.env.BT_PRIVATEKEY
});
/**
 * NOTE: Error messages returned should be consumable directly via a UI
 * @param db
 * @param cart
 * @returns {{getClientToken: getClientToken, makePayment: makePayment}}
 * @constructor
 */
const BraintreePayments = function(db, cart) {

    function getClientToken(done) {
        gateway.clientToken.generate({}, function (err, response) {
            if (err) {
                //We've failed to get a payment nonce from BrainTree
                logger.error('BraintreePayments:getClientToken - getToken method.  Failed with error: ' + err.message);
                done(new Error('We were unable to initiate an agreed payment with our payment suppliers.'), null);
            } else {
                done(null, response.clientToken)
            }
        });
    }

    function makePayment(nonce, done) {
        const PaymentAttempt = db.model('PaymentAttempt');
        let paymentAttempt = new PaymentAttempt({
            cart: cart.id,
            amount: cart.totalToPay,
            nonce: nonce,
            dateOfAttempt: new Date()
        });
        //Save this record to the db before we make the attempt at Braintree
        paymentAttempt.save(function(err, paymentAttempt) {

            /**
             * Multi-currency support
             * Not sure how this works yet; have sent an email to Braintree seeking clarification.  Not required for v1
             * anyway.
             */

                //MAKE THE TRANSACTION ATTEMPT
            gateway.transaction.sale({
                amount: paymentAttempt.amount,
                paymentMethodNonce: paymentAttempt.nonce
            }, function (err, result) {
                //Payment attempt was not made successfully.  Not a rejection of the payment, but an unsuccessful attempt
                if (err) {
                    logger.error('BraintreePayments:makePayment - sale method.  Failed to connect with Braintree with error: ' + err.message);
                    paymentAttempt.result = result;
                    paymentAttempt.success = false;
                    paymentAttempt.message = err.message;

                    // Save async, don't wait for the result
                    paymentAttempt.save(function(err) {
                        if (err) {
                            logger.error('BraintreePayments:makePayment - paymentAttempt.save method.  Failed with error: ' + err.message);
                        }
                    });
                    done(new Error('Failure with initialising the payment attempt.  No payment attempt was made.'), paymentAttempt);

                    return; //Leave the function
                }

                // Successfully contacted Braintree.
                // Save the result to the paymentAttempt record
                paymentAttempt.result = result;
                paymentAttempt.success = result.success;
                paymentAttempt.message = result.message;

                // Save async, don't wait for the result
                paymentAttempt.save(function(err) {
                    if (err) {
                        logger.error('BraintreePayments:makePayment - paymentAttempt.save method.  Failed with error: ' + err.message);
                    }
                });

                if (!paymentAttempt.success) {

                    // The payment was rejected, log all the details to the payment document
                    done(new Error(result.message), paymentAttempt);
                } else {
                    done(null, paymentAttempt);
                }
            });
        });
    }

    return {
        getClientToken: getClientToken,
        makePayment: makePayment
    }
};

module.exports = BraintreePayments;
