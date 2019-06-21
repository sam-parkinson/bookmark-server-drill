const BookmarksService = require('../src/bookmarks/bookmarks-service');
const app = require('../src/app')
const knex = require('knex');
const { expect } = require('chai');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe(`Bookmarks service object`, function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, []);
      })
    })

    context(`Given there are bookmarks`, () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it(`GET /bookmarks responds with 200 and all bookmarks`, () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testMarks)
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given no bookmark matching ID', () => {
      it(`responds with 404`, () => {
        const bkId = 9876;
        return supertest(app)
          .get(`/bookmarks/${bkId}`)
          .expect(404, { error: {message: '404 not found'} })
      });
    });

    context('Given there are bookmarks', () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it('GET /bookmarks/:id responds with 200 and specified bookmark', () => {
        const bkId = 3;
        const expectedMark = testMarks[bkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bkId}`)
          .expect(200, expectedMark);
      });
    });
  });
});