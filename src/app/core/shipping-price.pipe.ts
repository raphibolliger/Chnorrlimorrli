import { Pipe, PipeTransform } from '@angular/core';
import { formatShippingPrice } from '../../../supabase/functions/_shared/pricing';

@Pipe({ name: 'shippingPrice' })
export class ShippingPricePipe implements PipeTransform {
  transform(rappen: number): string {
    return formatShippingPrice(rappen);
  }
}
