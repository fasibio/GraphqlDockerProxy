var webpack = require('webpack')
var path = require('path')

const BUILD_DIR = path.resolve(__dirname, 'out')
var APP_DIR = path.resolve(__dirname, '')

var config = {
  entry: APP_DIR + '/index.js',
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.js?/,
        include: APP_DIR,
        loader: 'babel-loader',
      },
    ],
  },
}

module.exports = config
