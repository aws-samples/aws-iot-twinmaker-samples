// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

const path = require('path');

module.exports = {
  mode: 'development',
  entry: {},
  devtool: 'inline-source-map',

  externals: {
    'aws-sdk': 'aws-sdk',
    Synthetics: 'commonjs2 Synthetics',
    SyntheticsLogger: 'commonjs2 SyntheticsLogger',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: 'node',
};
