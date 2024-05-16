// use vite instead of webpack
const path = require('node:path')
const Dotenv = require('dotenv-webpack')

const options = {
  entry: {
    content: path.join(__dirname, 'ts', 'content.ts'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.ts',
  },
  plugins: [
    new Dotenv(),
  ],
}

module.exports = options
