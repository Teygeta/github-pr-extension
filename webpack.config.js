const path = require('path')
const webpack = require('webpack')

const options = {
  entry: {
    content: path.join(__dirname, 'ts', 'content.ts'),
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.ts',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GITHUB_ACCESS_TOKEN': JSON.stringify(process.env.GITHUB_ACCESS_TOKEN),
    }),
  ],
}

module.exports = options
