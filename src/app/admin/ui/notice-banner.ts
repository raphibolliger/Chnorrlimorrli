import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Router } from '@angular/router';
import { UserFacingError } from '../user-facing-error';

export interface Notice {
  tone: 'success' | 'danger';
  text: string;
}

export function success(text: string): Notice {
  return { tone: 'success', text };
}

export function danger(text: string): Notice {
  return { tone: 'danger', text };
}

export function failure(error: unknown, fallback: string): Notice {
  return danger(error instanceof UserFacingError ? error.message : fallback);
}

export function navigationNotice(router: Router): Notice | null {
  const text: string | undefined = router.currentNavigation()?.extras.state?.['notice'];
  return text ? success(text) : null;
}

const toneClasses: Record<Notice['tone'], string> = {
  success: 'bg-success-soft text-success-strong',
  danger: 'bg-danger-soft text-danger-strong',
};

@Component({
  selector: 'app-notice-banner',
  host: { class: 'block rounded-xl p-3 text-sm', '[class]': 'toneClass()', role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notice-banner.html',
})
export class NoticeBanner {
  readonly notice = input.required<Notice>();

  protected readonly toneClass = computed(() => toneClasses[this.notice().tone]);
}
