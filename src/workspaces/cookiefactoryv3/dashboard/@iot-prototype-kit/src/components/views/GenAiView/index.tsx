// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createRef, useEffect, useState } from 'react';

import { HeadIcon } from '@iot-prototype-kit/components/svgs/icons/HeadIcon';
import { useStore } from '@iot-prototype-kit/core/store';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { $entities, $selectedEntity } from '@iot-prototype-kit/stores/entity';
import { openPanel } from '@iot-prototype-kit/stores/panel';

import { processPanelId, scenePanelId } from '@/app.config';

import styles from './styles.module.css';

export function GenAiView({
  chainlitUrl,
  children,
  className,
  id,
  ...props
}: ComponentProps<{ chainlitUrl: string; id: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const iframeRef = createRef<HTMLIFrameElement>();

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
      $selectedEntity.set({ entity, originId: id });
      openPanel(scenePanelId);
      openPanel(processPanelId);
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleIframeMessage, false);
    return () => {
      window.removeEventListener('message', handleIframeMessage, false);
    };
  }, []);

  const eventData = {
    event_id: '98765',
    event_timestamp: '2021-10-01T00:00:00Z',
    event_title: 'Cookie Shape Anomaly Detected',
    event_description: 'number of deformed cookie > 10 per 5 minute',
    event_entity_id: 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298'
  };
  const iframeUrl = `${chainlitUrl}?user-data=${encodeURIComponent(JSON.stringify(eventData))}`;

  return (
    <main className={createClassName(styles.wrapper)} data-is-open={isOpen}>
      {isOpen && (
        <main className={createClassName(styles.root, className)} {...props}>
          <section data-content>
            <section data-head>Cookie Factory Assistant</section>
            <section>
              <iframe data-iframe ref={iframeRef} src={iframeUrl}></iframe>
            </section>
          </section>
        </main>
      )}
      <button data-trigger onPointerUp={() => setIsOpen((state) => !state)}>
        <HeadIcon data-icon />
      </button>
    </main>
  );
}
