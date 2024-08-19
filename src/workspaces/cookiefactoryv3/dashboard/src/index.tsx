// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { createRoot } from 'react-dom/client';

import Router from './routes'
import appConfig from './app.config';


const element = document.getElementById('root');

if (element) {
  createRoot(element).render(
  <React.StrictMode>
    <Router config={appConfig}/>
  </React.StrictMode>,
);
}
