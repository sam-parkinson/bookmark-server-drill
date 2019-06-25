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

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 1778,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    url: 'http://www.homestarrunner.net',
    rating: 2
  }

  const cleanBookmark = {
    ...maliciousBookmark, 
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }

  return {
    maliciousBookmark,
    cleanBookmark,
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
}