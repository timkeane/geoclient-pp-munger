const path = require('path')

module.exports =  {
  devtool: 'source-map',
  entry: './src/js/index.js',
  output: {
    filename: 'munger.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: true
  }
}
