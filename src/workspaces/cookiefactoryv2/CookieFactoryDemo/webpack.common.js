// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/index.tsx',

  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|hdr)$/i,
        use: [{ loader: 'file-loader' }]
      },
      {
        test: /\.(ts|js)x?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript'
            ]
          }
        },
        exclude: {
          and: [/node_modules/],
          not: [/scene-composer\/dist\/src/]
        }
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { modules: { auto: true } }
          }
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].css', chunkFilename: '[name].css' })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/'),
      'package.json': path.resolve(__dirname, './package.json')
    },
    extensions: ['.tsx', '.ts', '.js', '.css', '.scss']
  }
};
