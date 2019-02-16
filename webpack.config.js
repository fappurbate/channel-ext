const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [ '@babel/preset-env' ]
            }
          }
        ]
      }
    ]
  },
  externals: {
    fb: 'fb'
  },
  devtool: 'source-map'
};
