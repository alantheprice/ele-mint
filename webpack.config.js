const path = require('path')

module.exports = {
    entry: "./src/eleMint2.js",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "eleMint.min.js",
        library: 'eleMint',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    mode: 'production',
    devtool: 'source-map',
};