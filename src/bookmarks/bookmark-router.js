const express = require('express');
const xss = require('xss');
const { isWebUri } = require('valid-url')
const logger = require('../logger');
const bookmarks = require('../store');
const BookmarksService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const scrubBookmark = bookmark => ({
    id: bookmark.id,
    rating: Number(bookmark.rating), 
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description)
  })


bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(scrubBookmark))
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, rating, description } = req.body;
    const newBookmark = { title, url, rating, description }

    for(const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    if(!isWebUri(url)) {
      logger.error(`Invalid url supplied`)
      return res.status(400).json({
        error: { message: `Url in request body is invalid` }
      })
    }

    if(!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Invalid number supplied`)
      return res.status(400).json({
        error: { message: `Number in request body must be an integer between 0 and 5` }
      })
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(scrubBookmark(bookmark))
      })
      .catch(next)
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${req.params.id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark does not exist` }
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(scrubBookmark(res.bookmark))
  })
  .delete((req, res) => {
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.id
    )
    .then(() => {
      logger.info(`Bookmark with id ${req.params.id} deleted.`);
      res.status(204).end();
    })
  });

module.exports = bookmarkRouter;