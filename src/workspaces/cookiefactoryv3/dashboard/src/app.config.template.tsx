// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { addSeconds } from 'date-fns';

import { DashboardIcon } from '@iot-prototype-kit/components/svgs/icons/DashboardIcon';
import { NetworkIcon } from '@iot-prototype-kit/components/svgs/icons/NetworkIcon';
import { ProcessPanel } from '@iot-prototype-kit/components/views/PanelView/panels/ProcessPanel';
import { PanelView } from '@iot-prototype-kit/components/views/PanelView';
import type {
  AppConfig,
  CameraConfig,
  EntityConfig,
  EntityDataProperty,
  PanelConfig,
  Viewport,
  VisualizationData
} from '@iot-prototype-kit/types';

import { DashboardPanel } from '@/lib/components/panels/DashboardPanel';
import { EmptyStatePanel } from '@/lib/components/panels/EmptyStatePanel';
import { EventActivityStatus } from '@/lib/components/panels/EventsPanel';
import { OverlayContent } from '@/lib/components/panels/process/OverlayContent';
import { CookieFactoryLogoWide } from '@/lib/components/svgs/logos/CookieFactoryLogo';
import type { AppAlarms } from '@/lib/types';

const ENTITY_TYPES = {
  Camera: 'Camera',
  Equipment: 'Equipment',
  ProcessStep: 'Process step'
};

const TWINMAKER_CAMERAS: CameraConfig[] = [
  { displayName: 'Cameras...', id: crypto.randomUUID(), menuDisplayName: 'Default camera', isPlaceholder: true },
  { displayName: 'Cookie Line Overview', id: 'CameraTopView', isSelected: true },
  { displayName: 'Cookie Line 1: Freezer Tunnel', id: 'Freezer Tunnel Camera' },
  { displayName: 'Cookie Line 1: Manufacturing', id: 'Forming and Freezing Process Camera View' },
  { displayName: 'Cookie Line 1: Packaging', id: 'Packaging Process Camera View' }
];

export const dashboardPanelId = crypto.randomUUID();
export const eventsPanelId = crypto.randomUUID();
export const processPanelId = crypto.randomUUID();
export const scenePanelId = crypto.randomUUID();
export const videoPanelId = crypto.randomUUID();

export const chainlitUrl = 'http://localhost:8000';

export const simulationTriggerConfig = {
  componentTypeId: 'com.example.workspace.synthetics',
  entityId: 'Equipment_5c9e83d2-1880-4f83-affd-9a27f80d39f7'
};

export const triggerEventData = {
  event_id: '98765',
  event_timestamp: '2023-11-02T15:21:58.900Z',
  event_title: 'Cookie Shape Anomaly Detected',
  event_description: 'The number of deformed cookies exceeded 11 per 5 minutes.',
  event_entity_id: 'INSPECTOR_POST_FREEZER_TUNNEL_999d8796-55f1-4791-af53-fc210038686f'
};

const visualizationAlarms: AppAlarms = {
  down: {
    color: '#c63b34',
    comparisonOperator: 'EQ',
    label: { text: 'Down', show: true },
    showInLegend: true,
    value: 'Down'
  },

  blocked: {
    color: '#007bff',
    comparisonOperator: 'EQ',
    label: { text: 'Blocked', show: true },
    showInLegend: true,
    value: 'Blocked'
  },

  starved: {
    // color: '#F56F0A',
    color: '#f8de5c',
    comparisonOperator: 'EQ',
    label: { text: 'Starved', show: true },
    showInLegend: true,
    value: 'Starved'
  },

  normal: {
    color: '#adadad',
    comparisonOperator: 'EQ',
    label: { text: 'Normal', show: true },
    value: 'Normal'
  },

  running: {
    color: 'transparent',
    comparisonOperator: 'EQ',
    label: { text: 'Running', show: true },
    value: 'Running'
  },

  unknown: {
    color: '#767676',
    comparisonOperator: 'EQ',
    label: { text: 'Unknown', show: true },
    value: 'Unknown'
  }
};

const visualizationData: VisualizationData[] = [
  { color: '#00BBFF', id: 'cyan' },
  { color: '#cc00ff', id: 'magenta' },
  { color: '#ffbe2e', id: 'orange' },
  { color: '#ed76ef', id: 'purple' },
  { color: '#169970', id: 'green' },
  { color: '#2BA2CE', id: 'blue' }
];

export const panelConfigs: PanelConfig[] = [
  {
    button: {
      icon: <NetworkIcon />,
      label: 'Process'
    },
    element: (
      <ProcessPanel
        dashboardPanelId={dashboardPanelId}
        id={processPanelId}
        key={processPanelId}
        label="Process"
        overlayContent={(node) => <OverlayContent node={node} />}
      />
    ),
    id: processPanelId
  },
  {
    button: {
      icon: <DashboardIcon />,
      label: 'Dashboard'
    },
    element: (
      <DashboardPanel
        emptyState={() => (
          <>
            <div data-title>You&#8217;re all caught up!</div>
            <div data-message>No data available</div>
          </>
        )}
        id={dashboardPanelId}
        key={dashboardPanelId}
        label="Dashboard"
      />
    ),
    id: dashboardPanelId
  }
];

const equipmentEntityConfigs: EntityConfig[] = [
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'BOX_ERECTOR_142496af-df2e-490e-aed5-2580eaf75e40',
    isRoot: true,
    metadata: {
      displayName: 'Box Erector',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'BOX_SEALER_ad434a34-4363-4a36-8153-20bd7189951d',
    metadata: {
      displayName: 'Box Sealer',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: [
        {
          chartType: 'status',
          displayName: 'Equipment State',
          propertyQueryInfo: {
            propertyName: 'State',
            refId: crypto.randomUUID()
          },
          type: 'alarm-state'
        },
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Temperature',
          propertyQueryInfo: {
            propertyName: 'Temperature',
            refId: crypto.randomUUID()
          },
          type: 'data',
          unit: '°F'
        },
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Moisture',
          propertyQueryInfo: {
            propertyName: 'Moisture',
            refId: crypto.randomUUID()
          },
          type: 'data',
          unit: '%MC'
        }
      ]
    },
    entityId: 'COOKIE_FORMER_19556bfd-469c-40bc-a389-dbeab255c144',
    isRoot: true,
    metadata: {
      displayName: 'Cookie Former',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: [
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Buffered product',
          propertyQueryInfo: {
            propertyName: 'Total'
          },
          type: 'data'
        }
      ]
    },
    entityId: 'CONVEYOR_LEFT_TURN_b28f2ca9-b6a7-44cd-a62d-7f76fc17ba45',
    metadata: {
      displayName: 'Conveyor Left Turn',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: [
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Buffered product',
          propertyQueryInfo: {
            propertyName: 'Total'
          },
          type: 'data'
        }
      ]
    },
    entityId: 'CONVEYOR_RIGHT_TURN_c4f2df3d-26a2-45c5-a6c9-02ca00eb4af6',
    metadata: {
      displayName: 'Conveyor Right Turn',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: [
        {
          chartType: 'status',
          displayName: 'Equipment State',
          propertyQueryInfo: {
            propertyName: 'State'
          },
          type: 'alarm-state'
        },
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Temperature',
          propertyQueryInfo: {
            propertyName: 'Temperature'
          },
          type: 'data',
          unit: '°F'
        },
        {
          chartType: 'line',
          computeTrend: true,
          displayName: 'Speed',
          propertyQueryInfo: {
            propertyName: 'Speed'
          },
          type: 'data',
          unit: 'rpm'
        }
      ]
    },
    entityId: 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298',
    metadata: {
      displayName: 'Freezer Tunnel',
      description: ENTITY_TYPES.Equipment
    },
    video: {
      componentName: 'KinesisVideoStream',
      initialViewport: getVideoViewport('Wednesday, August 30, 2023 1:00:00 AM UTC', 60)
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'INSPECTOR_POST_FREEZER_TUNNEL_999d8796-55f1-4791-af53-fc210038686f',
    images: [
      '/img/test-anomaly-1.jpg',
      '/img/test-anomaly-2.jpg',
      '/img/test-normal-1.jpg',
      '/img/test-anomaly-3.jpg',
      '/img/test-anomaly-4.jpg',
      '/img/test-normal-2.jpg',
      '/img/test-anomaly-6.jpg',
      '/img/test-anomaly-7.jpg'
    ],
    metadata: {
      displayName: 'Cookie Inspector',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'LABELING_BELT_5f98ffd2-ced1-48dd-a111-e3503b4e8532',
    metadata: {
      displayName: 'Labeling Belt',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'PLASTIC_LINER_a77e76bc-53f3-420d-8b2f-76103c810fac',
    metadata: {
      displayName: 'Plastic Liner',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  },
  {
    component: {
      componentName: 'rateEquipment',
      properties: getProperties()
    },
    entityId: 'VERTICAL_CONVEYOR_d5423f7f-379c-4a97-aae0-3a5c0bcc9116',
    metadata: {
      displayName: 'Conveyor Vertical',
      description: ENTITY_TYPES.Equipment
    },
    visualization: {
      graph: { style: 'hexagon' }
    }
  }
];

const processEntityConfigs: EntityConfig[] = [
  {
    entityId: 'BoxErecting_db7dc38e-5b9c-46d4-a5b7-cd83543b7e63',
    metadata: {
      displayName: 'Box Erecting',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },
  {
    entityId: 'BoxLabeling_a9c0a04e-4681-43d4-8b73-c6c1bbcaf54b',
    metadata: {
      displayName: 'Box Labeling',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },
  {
    entityId: 'BoxSealing_78b17695-bf5a-4a0c-a15a-93232ce4abd6',
    metadata: {
      displayName: 'Box Sealing',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },

  {
    entityId: 'Forming_fbec6977-75c2-4cf8-a470-e61d0a589bb5',
    metadata: {
      displayName: 'Forming',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },

  {
    entityId: 'Freezing_01f790f8-08e4-401f-b2a2-6bc395178680',
    metadata: {
      displayName: 'Freezing',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },
  {
    entityId: 'Packing_defd8ea2-5535-432e-8f4b-bb80f5b3ff25',
    metadata: {
      displayName: 'Packing',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },
  {
    entityId: 'PlasticLining_09b64040-422c-47b0-a585-29e00ac28397',
    metadata: {
      displayName: 'Plastic Lining',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  },
  {
    entityId: 'Shipping_e118463f-6bf0-4079-8a26-5b610d9e56be',
    metadata: {
      displayName: 'Shipping',
      description: ENTITY_TYPES.ProcessStep
    },
    visualization: {
      graph: { style: 'ellipse' }
    }
  }
];

const cameraEntityConfigs: EntityConfig[] = [
  {
    entityId: 'd34d3afb-0b0a-477b-9aa6-f24813b75f92',
    metadata: {
      displayName: 'Manufacturing Process Camera',
      description: ENTITY_TYPES.Camera
    },
    video: {
      componentName: 'KinesisVideoStream',
      initialViewport: getVideoViewport('Wednesday, August 30, 2023 1:00:00 AM UTC', 60)
    },
    visualization: {
      graph: { style: 'diamond' }
    }
  },
  {
    entityId: '35fab901-ed85-41a8-95b2-59f71ffca1fd',
    metadata: {
      displayName: 'Packaging Process Camera',
      description: ENTITY_TYPES.Camera
    },
    video: {
      componentName: 'KinesisVideoStream',
      initialViewport: getVideoViewport('Wednesday, August 30, 2023 1:00:00 AM UTC', 60)
    },
    visualization: {
      graph: { style: 'diamond' }
    }
  }
];

const appConfig: AppConfig = {
  branding: <CookieFactoryLogoWide />,
  statusBarComponents: <EventActivityStatus panelId={eventsPanelId} />,
  userConfigs: [
    {
      email: 'user@cookiefactory',
      password: '__FILL_IN__',
      firstName: 'Spencer',
      title: 'Line Operator',
      cognito: {
        clientId: '__FILL_IN__',
        identityPoolId: '__FILL_IN__',
        region: '__FILL_IN__',
        userPoolId: '__FILL_IN__'
      },
      siteConfigs: [
        {
          id: crypto.randomUUID(),
          name: 'Bakersville Central',
          description: '1 Main Street, Bakersville, NC, USA',
          events: {
            createEventMessage(entity) {
              let normalizedName = '';
              let normailzedMessage = '';

              switch (entity.entityId) {
                case 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298': {
                  normalizedName = 'LN2 vapor flowing over exhaust troughs';
                  normailzedMessage = `[Critical] Clogged exhaust pipe or full blast gate in piping`;
                  break;
                }
                default: {
                  normalizedName = 'Abnormal speed reduction';
                  normailzedMessage = `Warning: Speed slowed abnormally on ${entity.metadata.displayName}`;
                }
              }

              return {
                subject: normalizedName,
                message: normailzedMessage
              };
            }
          },
          aws: {
            iot: {
              appkit: {
                sceneViewer: {
                  cameraControlMode: 'transition',
                  config: {
                    dracoDecoder: {
                      enable: true,
                      path: 'https://www.gstatic.com/draco/versioned/decoders/1.5.3/' // path to the draco files
                    }
                  }
                },
                timeSeriesData: {
                  requestSettings: {
                    refreshRate: 5000,
                    resolution: '1m'
                  },
                  viewport: {
                    duration: '1h'
                  }
                },
                visualization: {
                  alarms: visualizationAlarms,
                  data: visualizationData
                }
              },
              twinMaker: {
                cameras: TWINMAKER_CAMERAS,
                entityConfigs: [...equipmentEntityConfigs, ...processEntityConfigs, ...cameraEntityConfigs],
                relationshipConfigs: [
                  { relationshipName: 'belongTo', graph: { style: { lineStyle: 'dashed' } } },
                  { relationshipName: 'feed', graph: { style: { lineStyle: 'solid' } } },
                  { relationshipName: 'flowTo', graph: { style: { lineStyle: 'solid' } } }
                ],
                sceneId: 'CookieFactory',
                workspaceId: '__FILL_IN__'
              }
            }
          },
          routes: [
            {
              id: crypto.randomUUID(),
              path: '/',
              view: (
                <PanelView
                  autoOpenPanels={[
                    ({ entityId, video }) => {
                      if (video && entityId !== 'FREEZER_TUNNEL_e12e0733-f5df-4604-8f10-417f49e6d298') {
                        return videoPanelId;
                      }
                      return null;
                    }
                  ]}
                  configs={panelConfigs}
                  key={crypto.randomUUID()}
                  selectedPanelIds={[scenePanelId]}
                >
                  <EmptyStatePanel />
                </PanelView>
              )
            }
          ]
        }
      ]
    }
  ]
};

export default appConfig;

function getVideoViewport(startTimestamp: string, durationInSeconds: number): Viewport {
  const start = new Date(startTimestamp);
  const end = addSeconds(start, durationInSeconds);
  return { start, end };
}

function getProperties(): EntityDataProperty[] {
  return [
    {
      chartType: 'status',
      displayName: 'Equipment State',
      propertyQueryInfo: {
        propertyName: 'State',
        refId: crypto.randomUUID()
      },
      type: 'alarm-state'
    },
    {
      chartType: 'line',
      computeTrend: true,
      displayName: 'Good Product',
      propertyQueryInfo: {
        propertyName: 'Good_Parts_1Min',
        refId: crypto.randomUUID()
      },
      type: 'data',
      unit: '/min'
    },
    {
      chartType: 'line',
      computeTrend: true,
      displayName: 'Rejected Product',
      propertyQueryInfo: {
        propertyName: 'Bad_Parts_1Min',
        refId: crypto.randomUUID()
      },
      type: 'data',
      unit: '/min'
    }
  ];
}
