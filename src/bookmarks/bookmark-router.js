const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const bookmarks = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;

    if (!title || !url || !description || !rating ) {
      logger.error(`Incomplete bookmark provided`);
      return res
        .status(400)
        .send('Invalid data');
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };

    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/card/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(bk => bk.id == id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('404 not found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bkIndex = bookmarks.findIndex(bk => bk.id == id);

    if (bkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
  });

module.exports = bookmarkRouter;