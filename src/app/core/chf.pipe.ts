import { Pipe, PipeTransform } from '@angular/core';
import { formatChf } from '../../../supabase/functions/_shared/pricing';

@Pipe({ name: 'chf' })
export class ChfPipe implements PipeTransform {
  transform(rappen: number | null | undefined): string {
    return rappen == null ? '' : formatChf(rappen);
  }
}
