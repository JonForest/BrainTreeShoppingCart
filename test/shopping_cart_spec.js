 /* global describe, it, require */
'use strict';

const should = require('should');
const mongoose = require('mongoose');
const Payments = require('../index.js');
const async = require('async');

const inkub8_schemas = require('inkub8_schemas')();
const db =  mongoose.createConnection('mongodb://localhost/inkub8_test');
inkub8_schemas.init(db);
const loadData = require('./load_data.js');
const payments = new Payments(db);
const Project = db.model('Project');
const User = db.model('User');
const DiscountCode = db.model('DiscountCode');

describe("Cart", function() {
    let projects;
    before(function(done) {
        Project.remove().exec();
        User.remove().exec();
        DiscountCode.remove().exec();

        //Set the start/end dates
        let startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        let endDate = new Date();
        endDate.setDate(startDate.getDate() + 14);

        async.parallel([
            //Create the project test data
            function (next) {
                loadData.loadProjects(db, function(projs) {
                    projects = projs;
                    next();
                });
            },
            // Create a product we can use
            function (next) {
                let Product = db.model('Product');
                Product.remove().exec();
                (new Product({
                    name: 'Competition and Market Analysis Tools - Test',
                    tag: 'halftoolstest',
                    rrp: '100',
                    currencyCode: 'NZD'
                })).save(next())
            },
            // Create a new percentage discount
            function (next) {
                (new DiscountCode({
                    description: 'A 50% discount code for testing',
                    code: 'TEST50',
                    discountPercentage: 50,
                    startDate: startDate,
                    endDate: endDate
                })).save(next)
            }
        ], function(/*err, results*/) {
           done();
        });

    });

    describe('New Cart', function() {
        let Cart;
        beforeEach(function() {
            Cart = db.model('Cart');
            Cart.remove().exec();
        });
        it('creates a new cart', function(done) {
            //TODO: If I want to disassociate this from the project, I could turn this into a 'reference' number
            payments.createNewCart(projects[0].id, function(err, cart) {
                (cart != null).should.equal(true);
                (cart.hasOwnProperty('addProduct').should.equal(true));
                done();
            });

        });

        it('closes any existing open carts when retrieving a new cart', function(done) {
            payments.createNewCart(projects[0].id, function() {
                payments.createNewCart(projects[0].id, function() {
                    Cart.find({project: projects[0].id, status: 'open'}, function (err, existingCarts) {
                        (existingCarts.length).should.equal(1);
                        done();
                    });
                });
            });
        });

    });

    describe('Existing Cart', function() {
        let existingCart;
        let Cart;
        beforeEach(function(done) {
            Cart = db.model('Cart');
            Cart.remove().exec();
            done();
        });

        it('retrieves an existing cart', function(done) {
            payments.createNewCart(projects[0].id, function(err, cart) {
                existingCart = cart;
                payments.getExistingCart(projects[0].id, function(err, cart) {
                    (cart == null).should.not.equal(true);
                    done();
                });
            });
        });

        it('returns a null object if there is no existing cart', function(done) {
            payments.getExistingCart(projects[0].id, function(err, cart) {
                (cart == null).should.equal(true);
                done();
            });
        });
    });

    describe('Adding/Removing products', function() {
        it('add a product to the cart', function(done) {
            payments.createNewCart(projects[0].id, function(err, shoppingCart) {
                shoppingCart.addProduct('halftoolstest', function(err, cartEntity) {
                    //Both the updatedCart and cart should represent these
                    cartEntity.products.length.should.equal(1);
                    cartEntity.products[0].product.tag.should.equal('halftoolstest');
                    cartEntity.totalToPay.should.equal(100);
                    done();
                });
            });
        });
        it('fails when you attempt to add no products to the cart', function(done) {
            payments.createNewCart(projects[0].id, function(err, shoppingCart) {
                shoppingCart.addProduct(null, function (err, cartEntity) {
                    (err !== null).should.equal(true);
                    done();
                });
            });
        });
        it('fails when you attempt to add an incorrect product to the cart', function(done) {
            payments.createNewCart(projects[0].id, function(err, shoppingCart) {
                shoppingCart.addProduct('doesnotexist', function (err, cartEntity) {
                    (err !== null).should.equal(true);
                    err.message.should.containEql('Failed to add the product to the cart');
                    done();
                });
            });
        });

        // Removing a product is not currently required, so partked
        it('remove a product from the cart');
        it('attempting to remove a product that does not exist does not cause a failure');
    });

    describe('Adding a discount code', function() {
        let Cart = db.model('Cart');

        beforeEach(function(done) {
            //Tidy up any carts
            Cart.remove().exec();
            done();
        });
        it('adding a 50% discount code results in a half value cart', function(done) {
            payments.createNewCart(projects[0].id, function(err, shoppingCart) {
                shoppingCart.addProduct('halftoolstest', function () {
                    shoppingCart.applyDiscountCode('TEST50', function (err, cartEntity) {
                        (err === null).should.equal(true);
                        cartEntity.totalToPay.should.equal(50);
                        done();
                    });
                })
            });
        });
        it('discount code applied to a product added to the cart after the discount code applied');
        it('adding a $10 discount code results in a cart $10 less');
        it('adding a product specific discount code only affects the one product')
    });

    // TODO: Leaving these out for now until I find a better way of mocking out the braintree payments
    describe.skip('Basic payment methods', function() {
        let Cart = db.model('Cart');

        beforeEach(function(done) {
            //Tidy up any carts
            Cart.remove().exec();
            done();
        });
        it('can retrieve a client token', function(done) {
            payments.createNewCart(projects[0].id, function(err, shoppingCart) {
                shoppingCart.addProduct('halftoolstest', function () {
                    shoppingCart.getPaymentClientToken(function(err, token) {
                        (token != null).should.equal(true);
                        (err === null).should.equal(true);
                        done();
                    });
                })
            });
        });
        it('can make a successful payment');
    });

});