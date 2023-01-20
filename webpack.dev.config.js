const { merge } = require('webpack-merge')
const config = require('./webpack.config.js')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = merge(config, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: {
        directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    hot: true
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {from: './src/index.html'},
        {from: './data/nycc.json'}
      ]
    })
  ]
})
