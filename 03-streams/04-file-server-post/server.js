const url = require('url');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const {access, rm} = require('fs/promises');
const {pipeline} = require('node:stream');
const LimitSizeStream = require('./LimitSizeStream');
const LimitExceededError = require('./LimitExceededError');

const server = new http.Server();

const MAX_FILE_SIZE_IN_BYTES = 1024 * 1024;

server.on('request', async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      if (isNestedPath(pathname)) {
        res.statusCode = 400;
        res.end('Invalid path');
        return;
      }

      const fileExists = await exists(filepath);
      if (fileExists) {
        res.statusCode = 409;
        res.end('File already exists');
        return;
      }

      const stream = pipeline(
          req,
          new LimitSizeStream({limit: MAX_FILE_SIZE_IN_BYTES}),
          fs.createWriteStream(filepath),

          async (error) => {
            if (!error) {
              res.statusCode = 201;
              res.end('Upload success');
              return;
            }

            if (error instanceof LimitExceededError) {
              res.statusCode = 413;
              res.end('File too big');
              rm(filepath);
            } else {
              res.statusCode = 500;
              res.end('Internal server error');
            }
          },
      );

      req.on('aborted', () => {
        rm(filepath);
        stream.destroy();
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (e) {
    return false;
  }
};

const isNestedPath = (path) => {
  return path.split('/').length > 1;
};

module.exports = server;
