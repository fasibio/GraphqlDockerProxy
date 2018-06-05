const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const ReplacePlugin = require('webpack-plugin-replace')


module.exports = {
  entry: './index.js',
  target: 'node',
  output: {
    path: __dirname + '/dist', //eslint-disable-line
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["remove-hashbag-loader"]
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
        ],
        loader: 'babel-loader',
      },
    ],
  },
  resolveLoader: {
    alias: {
      "remove-hashbag-loader": __dirname + "/loaders/remove-hashbag-loader"
    }
  },
  plugins: [
    new Dotenv({
      path: './.env',
    }),
    new ReplacePlugin({
      exclude: [
        /node_modules/,
      ],
      values: {
        '/../__schemas__/': '/',
      },
    }),
  ],
}
