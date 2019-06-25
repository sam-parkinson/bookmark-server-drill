const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmarks')
  },
  getById(knex, id) {
    return knex.select('*').from('bookmarks').where('id', id).first()
  },
  insertBookmark(knex, bookmark) {
    return knex
      .insert(bookmark)
      .into('bookmarks')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  }
}

module.exports = BookmarksService;