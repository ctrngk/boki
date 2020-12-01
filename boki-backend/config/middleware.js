module.exports = {
  //...
  settings: {
    // cors: {
    //   origin: ['http://localhost', 'https://mysite.com', 'https://www.mysite.com'],
    // },
    parser: {
      jsonLimit: "100mb",
      formLimit: "100mb",
      "formidable": {
        "maxFileSize": 524288000
      }
    },
  },
};
