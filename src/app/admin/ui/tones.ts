export type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

export interface Chip {
  label: string;
  icon: IconName;
  tone: Tone;
}

export type IconName =
  | 'orders'
  | 'products'
  | 'shipping'
  | 'more'
  | 'logout'
  | 'website'
  | 'search'
  | 'back'
  | 'plus'
  | 'check'
  | 'clock'
  | 'close'
  | 'undo'
  | 'box'
  | 'user'
  | 'history'
  | 'image'
  | 'trash'
  | 'up'
  | 'down'
  | 'edit'
  | 'mail'
  | 'tag'
  | 'store';

export const chipToneClasses: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-success-muted text-success-strong',
  info: 'bg-info-muted text-info-strong',
  warning: 'bg-warning-muted text-warning-strong',
  danger: 'bg-danger-muted text-danger-strong',
};

export const surfaceToneClasses: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-500',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};
