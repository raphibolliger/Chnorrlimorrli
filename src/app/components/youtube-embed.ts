import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-youtube-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './youtube-embed.html',
})
export class YoutubeEmbed {
  readonly videoId = input.required<string>();
  readonly title = input.required<string>();

  protected readonly playing = signal(false);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly embedUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId())}?autoplay=1&rel=0&modestbranding=1`,
    ),
  );
}
