// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMenu } from '@iot-prototype-kit/core/hooks/useMenu';
import { createClassName, type ComponentProps } from '@iot-prototype-kit/core/utils/element';
import { isNotNil } from '@iot-prototype-kit/core/utils/lang2';

import './styles.css';

export function DropDownMenu({
  children,
  className,
  items,
  selectedKey,
  onSelect,
  ...props
}: ComponentProps<{
  items: Parameters<typeof useMenu>[0];
  selectedKey?: string;
  onSelect: (key: string) => void;
}>) {
  const { handleTrigger, menu: _menu, menuContainerRef } = useMenu(items, onSelect, { selectedKey });

  return (
    <section
      className={createClassName(className)}
      data-dropdownmenu
      data-is-open={isNotNil(_menu)}
      ref={menuContainerRef}
      {...props}
    >
      <button onPointerUp={handleTrigger}>{children}</button>
      {_menu}
    </section>
  );
}
