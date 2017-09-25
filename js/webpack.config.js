var version = require('./package.json').version;
var path = require( 'path' );

const babelSettings = {
  plugins: [
    'add-module-exports',
    'transform-regenerator',
    'transform-decorators-legacy'
  ],
  presets: [ 'es2015', 'react', 'stage-1' ]
};


module.exports = [
    {
      entry: './src/index.js',
      output: {
          filename: 'index.js',
          path: '/home/phil/PycharmProjects/flowpyBackend/flowpy/static',
          libraryTarget: 'umd'
      },
        resolve: {
    extensions: ['', '.jsx', '.scss', '.js', '.json'],
    modulesDirectories: [
      'node_modules',
      path.resolve(__dirname, './node_modules')
    ]
  },
      module : {
        loaders : [
                {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
    },
          {
            test: /(\.js|\.jsx)$/,
            exclude: /(node_modules|bower_components)/,
            loaders: [`babel?${JSON.stringify( babelSettings )}`]
          },
             { test: /\.css$/, loader: "style-loader!css-loader" },
          {
            test: /\.json$/, loader: 'json-loader'
          }
        ]
      }
    }
];
