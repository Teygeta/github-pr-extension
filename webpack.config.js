const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    content: './ts/content.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.ts',
  },
  plugins: [
    new Dotenv()
  ],
};
