const path = require('path');
const express = require('express');
const xss = require('xss');
const { isWebUri } = require('valid-url')
const logger = require('../logger');
const BookmarksService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const scrubBookmark = bookmark => ({
    id: bookmark.id,
    rating: Number(bookmark.rating), 
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
  })


bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(
      req.app.get('db')
    )
      .then(bookmarks => {
        res.json(bookmarks.map(scrubBookmark));
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
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(scrubBookmark(bookmark))
      })
      .catch(next)
  });

bookmarkRouter
  .route('/:id')
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
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.id
    )
    .then(() => {
      logger.info(`Bookmark with id ${req.params.id} deleted.`);
      res.status(204).end();
    })
  })
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error(`Empty request supplied`)
      return res.status(400).json({
        error: {
          message: `Request body must contain one of: 'title', 'url', 'description', 'rating`
        }
      });
    }

    if(url && !isWebUri(url)) {
      logger.error(`Invalid url supplied`)
      return res.status(400).json({
        error: { message: `Url in request body is invalid` }
      });
    }

    if(rating && (!Number.isInteger(rating) || rating < 0 || rating > 5)) {
      logger.error(`Invalid number supplied`)
      return res.status(400).json({
        error: { message: `Number in request body must be an integer between 0 and 5` }
      });
    }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = bookmarkRouter;