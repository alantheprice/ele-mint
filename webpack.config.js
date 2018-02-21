const path = require('path')
const webpack = require('webpack'); //to access built-in plugins

module.exports = {
    entry: "./src/eleMint.js",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "eleMint.min.js",
        library: 'eleMint',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ],
        rules: [
            {
              test: /\.js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['env']
                }
              }
            }
          ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
};