// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dynamicImport from 'vite-plugin-dynamic-import';
import commonjs from 'vite-plugin-commonjs';
import path from 'path';

export default defineConfig({
  /**
   * This is required to include the .hdr files in the build.
   * See optimizeDeps.esbuildOptions.loader below which is required to load the .hdr files using the dev server.
   */
  assetsInclude: ['**/*.hdr'],

  server: {
    https: true,
    port: 8443
  },

  plugins: [
    basicSsl(),
    /**
     * This plugin is required to resolve the charts-core module as they are dynamically imported
     * when the library is loaded.
     * See the dynamic loading code here: https://github.com/ionic-team/stencil/blob/main/src/client/client-load-module.ts#L32
     * Unfortunately, we are using an older version of the stencil library which doesn't use the syntax vite supports to
     * detect the dynamic imports automatically, so we need to use this plugin to explicitly tell vite to include the
     * charts-core module otherwise their code will not be included in the build.
     */
    dynamicImport({
      filter(id) {
        // `node_modules` is exclude by default, so we need to include it explicitly
        // https://github.com/vite-plugin/vite-plugin-dynamic-import/blob/v1.3.0/src/index.ts#L133-L135
        if (id.includes('/node_modules/@iot-app-kit/charts-core')) {
          return true;
        }
      }
    }),
    // required to support the commonjs require in dev builds
    commonjs(),
    react({
      // Use React plugin in all *.jsx and *.tsx files
      include: '**/*.{jsx,tsx}'
    })
  ],

  build: {
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    // required to support the commonjs require in production builds
    // See: https://github.com/originjs/vite-plugins/issues/9
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },

  optimizeDeps: {
    // This is required to load the .hdr files using the dev server.
    esbuildOptions: {
      loader: {
        '.hdr': 'dataurl'
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/'),
      '@iot-prototype-kit': path.resolve(__dirname, './@iot-prototype-kit/src/'),
      'package.json': path.resolve(__dirname, './package.json')
    }
  }
});
