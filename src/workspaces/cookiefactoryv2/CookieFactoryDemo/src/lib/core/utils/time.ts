// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

/**
 * Credit: https://www.builder.io/blog/relative-time
 */

export type RelativeTimeOptions = Partial<Intl.RelativeTimeFormatOptions & { locale: string }>;

// Array reprsenting one minute, hour, day, week, month, etc in seconds
const CUT_OFFS = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];

// Array equivalent to the above but in the string representation of the units
const UNITS: Intl.RelativeTimeFormatUnit[] = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];

export function getFormattedTimeString(
  timestamp: number,
  { dateStyle, timeStyle, timeZoneName }: Intl.DateTimeFormatOptions
) {
  const date = new Date(timestamp);
  return `${dateStyle ?? date.toLocaleDateString(undefined, { dateStyle }) + ' '}${date.toLocaleTimeString(undefined, {
    timeStyle,
    timeZoneName
  })}`;
}

export function getRelativeTimeString(
  date: Date | number,
  { locale = navigator.language, ...options }: RelativeTimeOptions = {}
): string {
  // Allow dates or times to be passed
  const timeMs = typeof date === 'number' ? date : date.getTime();

  // Get the amount of seconds between the given date and now
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

  // Grab the ideal cutoff unit
  const unitIndex = CUT_OFFS.findIndex((cutoff) => cutoff > Math.abs(deltaSeconds));

  // Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
  // is one day in seconds, so we can divide our seconds by this to get the # of days
  const divisor = unitIndex ? CUT_OFFS[unitIndex - 1] : 1;

  // Intl.RelativeTimeFormat do its magic
  const rtf = new Intl.RelativeTimeFormat(locale, options);
  return rtf.format(Math.floor(deltaSeconds / divisor), UNITS[unitIndex]);
}
