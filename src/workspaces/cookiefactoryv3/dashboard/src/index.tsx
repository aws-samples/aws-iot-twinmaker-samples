// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createRoot } from 'react-dom/client';

import { App } from '@iot-prototype-kit/components/App';

import appConfig from './app.config';
import styles from './styles.module.css';

const element = document.getElementById('root');

if (element) {
  createRoot(element).render(<App className={styles.app} config={appConfig} />);
}
