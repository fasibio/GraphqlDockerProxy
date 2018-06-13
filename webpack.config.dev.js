const Dotenv = require('dotenv-webpack')
var FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin')


module.exports = {
  entry: ['babel-polyfill', './index.js'],
  target: 'node',
  output: {
    path: __dirname + '/dist', //eslint-disable-line
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['remove-hashbag-loader'],
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              'transform-class-properties',
              'transform-flow-comments',
            ],
          },
        },
      },
    ],
    loaders: [
      // {
      //   test: /\.js$/,
      //   exclude: [
      //     /node_modules/,
      //   ],
      //   loader: 'babel',
      //   // options: {
      //   //   plugins: [
      //   //     'transform-es2015-arrow-functions',
      //   //     'check-es2015-constants',
      //   //     'transform-es2015-block-scoping',
      //   //     'syntax-async-functions',
      //   //     'transform-regenerator',
      //   //     'transform-class-properties',
      //   //     'transform-flow-strip-types',
      //   //     ['transform-runtime', {
      //   //       'polyfill': true,
      //   //       'regenerator': true,
      //   //     }],
      //   //   ],
      //   //   presets: ['env', 'es2015'],
      //   // },
      // },
    ],
  },
  resolveLoader: {
    alias: {
      'remove-hashbag-loader': __dirname + '/loaders/remove-hashbag-loader',
    },
  },
  plugins: [
    new Dotenv({
      path: './.env',
    }),
    new FlowBabelWebpackPlugin(),

  ],
}
