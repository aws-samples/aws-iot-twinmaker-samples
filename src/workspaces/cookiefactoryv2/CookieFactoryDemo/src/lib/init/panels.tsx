// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { DashboardPanel, EventsPanel, ProcessPanel, ScenePanel, VideoPanel } from '@/lib/components/panels';
import {
  BellOutlinedIcon,
  CameraIcon,
  DashboardIcon,
  ListIcon,
  MessagesIcon,
  NetworkIcon,
  SceneIcon
} from '@/lib/components/svgs/icons';
import type { Panel } from '@/lib/types';

export const PANELS: Panel[] = [
  {
    content: <ScenePanel />,
    icon: <SceneIcon />,
    id: 'scene',
    isVisible: false,
    label: 'Scene',
    priority: 1,
    slot: 1
  },

  {
    content: <ProcessPanel />,
    icon: <NetworkIcon />,
    id: 'process',
    isVisible: false,
    label: 'Process',
    priority: 2,
    slot: 1
  },
  {
    content: <DashboardPanel />,
    icon: <DashboardIcon />,
    id: 'dashboard',
    isVisible: false,
    label: 'Dashboard',
    priority: 3,
    slot: 1
  },
  // {
  //   content: <VideoPanel />,
  //   icon: <CameraIcon />,
  //   id: 'live',
  //   isVisible: false,
  //   label: 'Live',
  //   priority: 4,
  //   slot: 1
  // },
  {
    content: <EventsPanel />,
    icon: <BellOutlinedIcon />,
    id: 'events',
    isVisible: false,
    label: 'Events',
    priority: 1,
    slot: 2
  }
  // {
  //   icon: <ListIcon />,
  //   id: 'tickets',
  //   label: 'Tickets',
  //   priority: 2,
  //   slot: 2
  // },
  // {
  //   icon: <MessagesIcon />,
  //   id: 'messages',
  //   label: 'Messages',
  //   priority: 3,
  //   slot: 2
  // }
];
