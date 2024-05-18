// use vite instead of webpack
const path = require('node:path')
const Dotenv = require('dotenv-webpack')

const options = {
  entry: {
    content: path.join(__dirname, 'src', 'content.ts'),
    // background: path.join(__dirname, 'ts', 'background.ts'),
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
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
}

module.exports = options
