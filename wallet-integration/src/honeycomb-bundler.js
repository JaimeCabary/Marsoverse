// honeycomb-bundler.js
// Run this in your React app directory to create a bundle for vanilla JS

const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/honeycomb-bundle.js',
  output: {
    path: path.resolve(__dirname, 'public/scripts'),
    filename: 'honeycomb-bundle.js',
    library: 'HoneycombClient',
    libraryTarget: 'umd'
  },
  mode: 'production',
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url/"),
      "zlib": require.resolve("browserify-zlib")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ]
};

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error('Build failed:', err || stats.compilation.errors);
  } else {
    console.log('✅ Honeycomb bundle created successfully!');
  }
});