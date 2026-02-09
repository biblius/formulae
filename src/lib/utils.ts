import { DateFormatter } from '@internationalized/date';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/** Date formatter */
export const df = new DateFormatter('en-US', {
  dateStyle: 'long'
});

/** Gram formatter */
export const gf = new Intl.NumberFormat('en-US', {
  style: 'unit',
  unit: 'gram',
  unitDisplay: 'short',
  minimumFractionDigits: 2
});

/** Percentage formatter */
export const pf = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2
});
