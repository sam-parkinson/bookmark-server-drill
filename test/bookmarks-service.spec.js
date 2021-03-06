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

  describe('GET /api/bookmarks', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
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

      it(`GET /api/bookmarks responds with 200 and all bookmarks`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect(200, testMarks)
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, cleanBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      });

      it(`GET /api/bookmarks responds with 200 and XSS attack removed`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .expect([cleanBookmark])
      });
    });
  });

  describe('GET /api/bookmarks/:id', () => {
    context('Given no bookmark matching ID', () => {
      it(`responds with 404`, () => {
        const bkId = 9876;
        return supertest(app)
          .get(`/api/bookmarks/${bkId}`)
          .expect(404, { error: { message: `Bookmark does not exist` } })
      });
    });

    context('Given there are bookmarks', () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it('GET /api/bookmarks/:id responds with 200 and specified bookmark', () => {
        const bkId = 3;
        const expectedMark = testMarks[bkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bkId}`)
          .expect(200, expectedMark);
      });
    });

    context('Given an XSS attac bookmark', () => {
      const { maliciousBookmark, cleanBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert(maliciousBookmark)
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .expect(200, cleanBookmark)
      })
    });
  });

  describe('POST /api/bookmarks', () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
      const newBookmark = {
        title: 'Test title',
        url: 'https://mlb.com',
        rating: 5,
        description: 'Play ball!'
      };
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(postRes => {
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
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
            .post('/api/bookmarks')
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
          .post('/api/bookmarks')
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
          .post('/api/bookmarks')
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
          .post(`/api/bookmarks`)
          .send(maliciousBookmark)
          .expect(res => {
            expect(res.body.title).to.eql(cleanBookmark.title)
            expect(res.body.description).to.eql(cleanBookmark.description)
          });
      });
    });
  });

  describe('DELETE /api/bookmarks/:id', () => {
    context(`Given that there are articles in the database`, () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it(`responds with 204 and removes the bookmark`, () => {
        const idToRemove = 2;
        const expectedMarks = testMarks.filter(mark => mark.id !== idToRemove);

        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res => {
            supertest(app)
            .get(`/api/bookmarks`)
            .expect(expectedMarks)
          })
      });
    });

    context(`Given no bookmarks`, () => {
      it(`responds with 404 and an error message`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .expect(404, {
            error: { message: `Bookmark does not exist` }
          });
      });
    });
  });

  describe('PATCH /api/bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, {
            error: { message: `Bookmark does not exist` }
          });
      });
    });

    context(`Given there are bookmarks in the database`, () => {
      const testMarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testMarks)
      });

      it(`respond with 204 and updates the bookmark`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'Updated Test Title',
          url: 'https://homestarrunner.com',
          description: 'Homestarrunner dot net: it\'s dot com',
          rating: 4
        }
        const expectedMark = {
          ...testMarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res => 
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedMark)
          )
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ garbage: 'trash at trash dot com' })
          .expect(400, {
            error: {
              message: `Request body must contain one of: 'title', 'url', 'description', 'rating`
            }
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
          url: 'https://homestarrunner.com',
        }
        const expectedMark = {
          ...testMarks[idToUpdate - 1],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(204)
            .then(res => 
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .expect(expectedMark)
            )
      });
    });
  });
});