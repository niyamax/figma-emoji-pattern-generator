const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env, argv) => ({
  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    ui: './src/ui.js', // The entry point for your UI code
    code: './src/code.js', // The entry point for your plugin code
  },

  module: {
    rules: [
      // Enables including CSS
      { test: /\.css$/, loader: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
  
      // Single rule for images including SVGs - converts to data URI
      { test: /\.(png|jpg|gif|webp)$/, loader: [{ loader: 'url-loader',}]},
      { test: /\.svg$/,
        resourceQuery: /raw/,
        use: 'raw-loader'}
    ],
  },

  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'), // Compile into a folder called "dist"
  },

  // Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      inlineSource: '.(js)$',
      chunks: ['ui'],
    }),
    new HtmlWebpackInlineSourcePlugin(),
  ],
  optimization:{
      minimize: false
  }
})