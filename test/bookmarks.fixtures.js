function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Test Title 1',
      url: 'https://en.wikipedia.org',
      description: 'Test Description 1',
      rating: 5
    },
    {
      id: 2,
      title: 'Test Title 2',
      url: 'https://www.reddit.com',
      description: 'Test Description 2',
      rating: 5
    },
    {
      id: 3,
      title: 'Test Title 3',
      url: 'https://giantitp.com',
      description: 'Test Description 3',
      rating: 2
    },
    {
      id: 4,
      title: 'Test Title 4',
      url: 'https://ytmnd.com',
      description: 'Test Description 4',
      rating: 5
    }
  ];
}

module.exports = {
  makeBookmarksArray,
}