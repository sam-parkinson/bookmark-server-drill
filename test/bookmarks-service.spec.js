const app = require('../src/app')
const knex = require('knex');
const { expect } = require('chai');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

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

  describe('POST /bookmarks', () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
      const newBookmark = {
        title: 'Test title',
        url: 'https://mlb.com',
        rating: 5,
        description: 'Play ball!'
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        })
        .then(postRes => {
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        });
    });

    context(`Given an incomplete or invalid input`, () => {
      const requiredFields = ['title', 'url', 'rating']

      requiredFields.forEach(field => {
        const newBookmark = {
          title: 'Test title',
          url: 'https://mlb.com',
          rating: 5,
          description: 'Play ball!'
        };

        it(`responds with 400 and an error message when '${field}' is missing`, () => {
          delete newBookmark[field];

          return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .expect(400, {
              error: { message: `Missing '${field}' in request body` }
            });
        });
      });

      it(`responds with 400 and an error message when 'url' is invalid`, () => {
        const badURL = {
          title: 'Test title',
          url: 'trash input',
          rating: 5,
          description: 'Play ball!'
        };

        return supertest(app)
          .post('/bookmarks')
          .send(badURL)
          .expect(400, {
            error: { message: `Url in request body is invalid` }
          });
      });

      it(`responds with 400 and an error message when the 'rating' is invalid`, () => {
        const badRating = {
          title: 'Test title',
          url: 'https://mlb.com',
          rating: 6,
          description: 'Play ball!'
        };

        return supertest(app)
          .post('/bookmarks')
          .send(badRating)
          .expect(400, {
            error: { message: `Number in request body must be an integer between 0 and 5` }
          });
      });
    });

    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, cleanBookmark } = makeMaliciousBookmark();

      it(`removes XSS attack content`, () => {
        return supertest(app)
          .post(`/bookmarks`)
          .send(maliciousBookmark)
          .expect(res => {
            expect(res.body.title).to.eql(cleanBookmark.title)
            expect(res.body.description).to.eql(cleanBookmark.description)
          });
      });
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    context(`Given that there are articles in the database`, () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it(`responds with 204 and removes the bookmark`, () => {
        
      })
    });
  });
});