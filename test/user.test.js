const dbHandler = require('./db-handler');
const app = require('../app') ;
const db = require('../models/index');
const supertest = require('supertest');
const request = supertest(app);
const mongoose = require('mongoose');
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
    await db.user.create(user1);
    await db.user.create(user2);
};

const user1 = {
    _id : new mongoose.mongo.ObjectId("16cb91bdc3464f14678934ca"),
    type: 'buyer',
};
const user2 = {
    _id : new mongoose.mongo.ObjectId("26cb91bdc3464f14678934ca"),
    type: 'artist',
    collections:["collection1","collectionToDelete"]
};

describe('get user by id ', () => {

    it('returns user by id', async () => {
        const response = await request.get('/mes/user/16cb91bdc3464f14678934ca');
        const user = response.body;

        expect(response.status).toBe(200);
        expect(user._id).toBe('16cb91bdc3464f14678934ca');
    });

    it('fails to return user by unkwon id', async () => {
        const response = await request.get('/mes/user/06cb91bdc3464f14678934ca');

        expect(response.status).toBe(500);
        expect(response.text).toBe("user not found" );
    });

})

describe('get users ', () => {

   it('returns all users', async () => {
        const response = await request.get('/mes/user');
        const users = response.body;

        expect(response.status).toBe(200);
        expect(users.length).toBe(2);
        expect(users[0]._id).toBe('16cb91bdc3464f14678934ca');
        expect(users[1]._id).toBe('26cb91bdc3464f14678934ca');
    });

   it('returns all artists', async () => {
        const response = await request.get('/mes/user?type=artist');
        const users = response.body;

        expect(response.status).toBe(200);
        expect(users.length).toBe(1);
        expect(users[0]._id).toBe('26cb91bdc3464f14678934ca');
    });
    it('returns all collections', async () => {
        const response = await request.get('/mes/user/allCollections');
        const collections = response.body;
        console.log(collections)
        expect(response.status).toBe(200);

    });


})

describe('add collections to user ', () => {

    it('add only new collections to user', async () => {
        const response = await request.patch('/mes/user/addCollections')
        .send({userId: '26cb91bdc3464f14678934ca', collections: ["collection1","collection2"]});

        const user = response.body;

        expect(response.status).toBe(200);
        expect(user._id).toBe('26cb91bdc3464f14678934ca');
        expect(user.collections).toStrictEqual(["collection1","collectionToDelete","collection2"]);

    });

    it('fails to add collections to non exisiting user', async () => {
        const response = await request.patch('/mes/user/addCollections')
        .send({userId: '00cb91bdc3464f14678934ca', collections: ["collection1","collection2",]});

        expect(response.status).toBe(500);
        expect(response.text).toBe('user not found');

    });

})
describe('login users ', () => {

    it('login non saved user', async () => {
        const response = await request.post('/mes/user/login')
        .send({email:"m7moodali88@gmail.com",password:"123456"});
        const user = response.body;

        expect(response.status).toBe(200);
        expect(user.id).toBe(11);
    });
})

describe('delete collections of user ', () => {

    it('delete a  collection', async () => {
        const response = await request.patch('/mes/user/deleteCollections')
        .send({userId: '26cb91bdc3464f14678934ca', collections: ["collectionToDelete"]});

        const user = response.body;

        expect(response.status).toBe(200);
        expect(user._id).toBe('26cb91bdc3464f14678934ca');
        expect(user.collections).toStrictEqual(["collection1"]);

    });

})