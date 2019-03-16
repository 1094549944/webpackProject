let path = require('path')
let webpack = require('webpack')
let CleanWebpackPlugin = require('clean-webpack-plugin')
let extractTextWebpackPlugin = require('extract-text-webpack-plugin')
let HtmlWebpackBannerPlugin = require('html-webpack-banner-plugin')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let PurifyCSSPlugin = require('purifycss-webpack')
let glob = require('glob-all')
let OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
let UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin')
module.exports = {
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    host: 'localhost',
    compress: true,
    progress: true,
    port: 9090,
    proxy: {
      '**/*.do': {
        target: 'http://test.happymmall.com/',
        changeOrigin: true
      }
    }
  },
  entry: {
    index: __dirname + '/views/index/index.js',
    about: __dirname + '/views/about/index.js'
  },
  output: {
    filename: '[name][hash:8].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: {
          loader: 'html-withimg-loader'
        }
      },
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
      },
      /*
       * 【改动】：图片文件的加载方式变化，并和字体文件分开处理
       */
      // 图片的配置
      {
        test: /\.(png|jpg|gif|jpeg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              /*
               * 【改动】：图片小于2kb的按base64打包
               */
              limit: 2048,
              name: 'resource/[name].[ext]',
              outputPath: 'img/'
            }
          },
          {
            loader: 'img-loader',
            options: {
              gifsicle: {
                interlaced: false
              },
              mozjpeg: {
                progressive: true,
                arithmetic: false
              },
              optipng: false, // disabled
              pngquant: {
                floyd: 0.5,
                speed: 2
              },
              svgo: {
                plugins: [{ removeTitle: true }, { convertPathData: false }]
              }
            }
          }
        ]
      },
      /*
       * 【改动】：字体文件的加载方式变化
       */
      // 字体图标的配置
      {
        test: /\.(eot|svg|ttf|woff|woff2|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'resource/[name].[ext]'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: extractTextWebpackPlugin.extract({
          fallback: {
            loader: 'style-loader'
            /* options: {
               insertInto: 'body',//插入到哪个dom上面
               singletom: true, // 把所有的style合成一个
               transform: './css.transform.js' // 类似钩子，发生在浏览器环境，可以根据浏览器环境不同做出不同的兼容，例如做media query
             }*/
          },
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: true, // 开启压缩
                module: true // 模块化
              }
              // loader: 'file-loader',
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  // require('autoprefixer')(),
                  require('cssnano')(),
                  require('postcss-cssnext')()
                ]
              }
            }
          ]
        })
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                // require('autoprefixer')(), // cssnext 包含autoprefixer
                require('cssnano')(),
                require('postcss-cssnext')()
              ]
            }
          },
          {
            loader: 'less-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '/views/index.html'),
      inject: true,
      minify: {
        // 去除双引号
        removeAttributeQuotes: true,
        // 是否去除空格
        collapseWhitespace: true
      },
      // 添加hash 时间戳
      hash: true
    }),
    new HtmlWebpackBannerPlugin({
      banner: '2019 maker by jiaxinying'
    }),
    new CleanWebpackPlugin(),
    // 告诉是哪个模块更新了 打印更新的模块路径
    new webpack.NamedModulesPlugin(),
    // 启用热更新
    new webpack.HotModuleReplacementPlugin(),
    // 提取css 样式
    new extractTextWebpackPlugin({
      filename: '[name].min.css',
      allChunks: false // 制定提取css的范围,提取初始化（非异步加载）,此时在commonChunk插件下，css也会被当成一个chunk,所有要用contenthash
    }),
    // tree -shaking  使用purifycss-webpack来实现css的Tree Shaking，Tree Shaking意思是摇树，即为将项目中没有用到的css代码或js代码过滤掉，不将其打包到文件中
    new PurifyCSSPlugin({
      // Give paths to parse for rules. These should be absolute!
      //处理根目录下的html 文件
      paths: glob.sync(path.join(__dirname, 'dist/*.html')),
      // 处理src 目录下的js 文件
      paths: glob.sync(path.join(__dirname, 'dist/*.js'))
    })
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5, // The default limit is too small to showcase the effect
          minSize: 0 // This is example is too small to create commons chunks,
        },
        'vendor-pageA': {
          // 直接使用 test 来做路径匹配
          test: /vue|element-ui/,
          chunks: 'initial',
          name: 'vendor-pageA',
          enforce: true
        },
        // 直接使用 test 来做路径匹配
        'vendor-pageB': {
          test: /react/,
          chunks: 'initial',
          name: 'vendor-pageB',
          enforce: true
        }
      }
    },
    runtimeChunk: {
      name: 'manifest'
    },
    minimizer: [
      new UglifyjsWebpackPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      }),
      new OptimizeCssAssetsWebpackPlugin()
    ]
  }
}
