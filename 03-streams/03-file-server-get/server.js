const url = require('url');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const server = new http.Server();

server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      if (isNestedPath(pathname)) {
        res.statusCode = 400;
        res.end('Invalid path');
        return;
      }

      const read = fs.createReadStream(filepath);
      read.on('error', handleReadError(res));

      read.pipe(res);

      req.on('aborted', () => read.destroy());
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

const isNestedPath = (path) => {
  return path.split('/').length > 1;
};

const handleReadError = (res) => (error) => {
  if (error.code === 'ENOENT') {
    res.statusCode = 404;
    res.end('Not found');
  } else {
    res.statusCode = 500;
    res.end('Internal server error');
  }
};

module.exports = server;
