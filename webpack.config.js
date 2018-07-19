const Dotenv = require('dotenv-webpack')
const path = require('path')

module.exports = {
  entry: './index.js',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /node_modules\/JSONStream\/index\.js$/,
        use: ['babel-loader', 'shebang-loader'],
      },
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
        ],
        loader: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: './.env',
    }),
  ],
}
