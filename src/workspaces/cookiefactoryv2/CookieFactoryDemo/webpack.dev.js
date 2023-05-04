import path from 'path';
import { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';

import common from './webpack.common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default merge(common, {
  mode: 'development',

  devServer: {
    https: true,
    hot: true,
    port: 8080,
    static: './public/'
  },

  devtool: 'inline-source-map',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '/dev/')
  }
});
