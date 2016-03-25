/* eslint no-console: 0 */

import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from './webpack.config.js';
import bodyParser from 'body-parser';
import fs from 'fs';
import mongobless from 'mongobless';
import { init } from './shape';
import params from './params';

const isDeveloping = process.env.NODE_ENV !== 'production';
const port = process.env.PORT ? process.env.PORT : 3004;
const app = express();


console.log("Starting server...")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

if (isDeveloping) {
  const compiler = webpack(config);
  const middleware = webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
  app.get('/', function response(req, res) {
    res.write(middleware.fileSystem.readFileSync(path.join(__dirname, 'dist/index.html')));
    res.end();
  });

  app.get('/out.json', function response(req, res) {
    res.write(fs.readFileSync(path.join(__dirname, 'out.json')));
    res.end();
  })

} else {
  app.use(express.static(__dirname + '/dist'));
  app.get('/', function response(req, res) {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

console.log("--- Connecting DB...")
mongobless.connect(params.db, (err) => {
	if (err) throw err
	console.log("--- DB Connected")
	init(app)
})

process.on('exit', function() {
	mongobless.close()
});

app.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
});
