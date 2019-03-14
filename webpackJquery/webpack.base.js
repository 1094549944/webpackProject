let path = require('path')
let webpack = require('webpack')
let CleanWebpackPlugin = require('clean-webpack-plugin')
module.exports = {
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    host: 'localhost',
    hot: true, // 启用热更新
    overlay: false,
    compress: true,
    progress: true,
    port: 9090
  },
  entry: {
    index: './views/index/index.js',
    about: './views/about/index.js'
  },
  output: {
    filename: '[name].[hash:8].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [new CleanWebpackPlugin()],

  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['>1%', 'last 2 versions']
                  }
                }
              ]
            ]
          }
        },
        exclude: '/node_modules/'
      }
    ]
  }
}
