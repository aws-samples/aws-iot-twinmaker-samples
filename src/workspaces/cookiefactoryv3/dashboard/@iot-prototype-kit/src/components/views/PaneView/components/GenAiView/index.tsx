// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from 'react';

import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $entities, setSelectedEntity } from '@iot-prototype-kit/stores/entity';
import { openPanel } from '@iot-prototype-kit/stores/panel';

import { chainlitUrl, processPanelId, triggerEventData } from '@/app.config';

import styles from './styles.module.scss';
import { delay } from '@iot-prototype-kit/core/utils/lang2';

const encodedEventData = encodeURIComponent(JSON.stringify(triggerEventData));
const genaiViewId = crypto.randomUUID();

export function GenAiView({
  children,
  className,
  onDismiss,
  reset,
  ...props
}: ComponentProps<{ onDismiss?: () => void; reset?: boolean }>) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeUrl = `${chainlitUrl}?user-data=${encodedEventData}`;

  const sendMessageToIframe = (message: string) => {
    if (iframeRef.current !== null) {
      const iframeContentWindow = iframeRef.current.contentWindow;
      iframeContentWindow?.postMessage(
        {
          message
        },
        '*'
      );
    }
  };

  const handleIframeMessage = (event: any) => {
    if (event.origin !== chainlitUrl) return;

    const entity = $entities.get()[event.data.entityId];

    if (entity) {
      setSelectedEntity(entity, genaiViewId);
      openPanel(processPanelId);
    }
  };

  useEffect(() => {
    if (reset) {
      delay(() => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      }, 1000);
    }
  }, [reset]);

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage, false);
    return () => {
      window.removeEventListener('message', handleIframeMessage, false);
    };
  }, []);

  return (
    <main className={createClassName(styles.root, className)} {...props}>
      <section data-head>Cookie Factory Assistant</section>
      <section data-chainlit>
        <iframe data-iframe ref={iframeRef} src={iframeUrl}></iframe>
      </section>
      <button data-close-button onPointerUp={onDismiss}>
        Close issue
      </button>
    </main>
  );
}
