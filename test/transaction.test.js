const dbHandler = require('./db-handler');
const app = require('../app') ;
const db = require('../models/index');
const supertest = require('supertest');
const request = supertest(app);
const mongoose = require('mongoose');
const {convertEurToEth} = require('../services/transaction')
/**
 * Connect to a new in-memory database before running any test.
 */
beforeAll(async () => {
    await dbHandler.closeDatabase();
    await dbHandler.connect();
});

/**
 *  then seed the data before every test.
 */
beforeEach(async () => {
    await createData();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
    await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
   await dbHandler.closeDatabase();
});

const createData = async () => {

};

const user1 = {
    _id : new mongoose.mongo.ObjectId("16cb91bdc3464f14678934ca"),
    name: 'user1',
    type: 'buyer',
    collections:["collection1"]
};
const user2 = {
    _id : new mongoose.mongo.ObjectId("26cb91bdc3464f14678934ca"),
    name: 'user2',
    type: 'artist'
};

describe('buy ', () => {

   /* it('return transaction of buying NFTs', async () => {
        const response = await request.post('/mes/transaction/buy');
        //const user = response.body;

        expect(response.status).toBe(200);
        //expect(user._id).toBe('16cb91bdc3464f14678934ca');
    });
*/
   /* it('return transaction of buying NFTs', async () => {
        expect(await convertEurToEth(1000)).toStrictEqual(0.6177415369409439)
    });*/

})



