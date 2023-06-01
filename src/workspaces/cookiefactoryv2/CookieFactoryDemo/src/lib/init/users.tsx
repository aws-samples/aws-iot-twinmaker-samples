// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import users from '@/config/users';
import { AvatarIcon } from '@/lib/components/svgs/icons';
import type { User } from '@/lib/types';

export const USERS: User[] = users.map((user) => ({
  ...user,
  icon: <AvatarIcon />,
  id: crypto.randomUUID()
}));
