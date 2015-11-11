/* global describe, it, require */
'use strict';

const BraintreePayments = require('../modules/braintree_payments');
const mongoose = require('mongoose');
const db =  mongoose.createConnection('mongodb://localhost/inkub8_test');
const cartSchema = require('../schemas/cart_schema');
const paymentAttemptSchema = require('../schemas/payment_attempt_schema');
const Cart = db.model('Cart', cartSchema);
require('productschemas')(db);

describe("Braintree Payments", function() {
    db.model('PaymentAttempt', paymentAttemptSchema);

    describe("Creating a clientToken", function() {
        it('generates a clientToken', function(done) {
            if (!testPayments()) {
                done();
                return;
            }
            const braintreePayments = new BraintreePayments();
            braintreePayments.getClientToken(function (err, clientToken) {
                (clientToken != null).should.equal(true);
                (err == null).should.equal(true);
                done();
            });
        });
    });

    //TODO: Consider use of sinon.js to stub out actual requests to Braintree.  Though, I do like having the real responses...?
    describe("Making a payment attempt", function() {
        it('makes a successful attempt', function(done) {
            this.timeout(3000);
            if (!testPayments()) {
                done();
                return;
            }
            paymentAttempt(1000, function(err, result) {
                (err == null).should.equal(true);
                (result.success).should.equal(true);
                done();
            })
        });
        it('fails due to a processor declined ', function(done) {
            if (!testPayments()) {
                done();
                return;
            }
            paymentAttempt(2000, function(err, result) {
                (err != null).should.equal(true);
                (result.success).should.equal(false);
                (result.message).should.containEql('Honor');
                done();
            })
        });
        it('fails due to a gateway rejected', function(done) {
            if (!testPayments()) {
                done();
                return;
            }
            paymentAttempt(5001, function(err, result) {
                (err != null).should.equal(true);
                (result.success).should.equal(false);
                (result.message).should.containEql('incomplete');
                done();
            })
        });
        it('fails if zero amount', function(done) {
            if (!testPayments()) {
                done();
                return;
            }
            paymentAttempt(0, function(err, result) {
                (err != null).should.equal(true);
                (result.success).should.equal(false);
                (result.message).should.containEql('greater than zero');
                done();
            })
        });
        it('fails due to a null nonce', function(done) {
            if (!testPayments()) {
                done();
                return;
            }
            const cart = new Cart({
                project: 1111111,
                totalToPay: 49.00
            });

            const braintreePayments = new BraintreePayments(db, cart);
            braintreePayments.makePayment(null, function(err, result) {
                (err != null).should.equal(true);
                err.message.should.containEql('Failed to record your details');
                done();
            });
        })

    });
});

function paymentAttempt(amount, done) {
    const cart = new Cart({
        project: 1111111,
        totalToPay: amount
    });

    const braintreePayments = new BraintreePayments(db, cart);
    braintreePayments.makePayment('fake-valid-nonce', done);
}

/**
 * @return {boolean}
 */
function testPayments() {
    if (process.env.BT_MERCHANTID && process.env.BT_PUBLICKEY && process.env.BT_PRIVATEKEY) {
        return true;
    } else {
        console.log('Must have BrianTree environment variables configured to test this');
        return false;
    }

}