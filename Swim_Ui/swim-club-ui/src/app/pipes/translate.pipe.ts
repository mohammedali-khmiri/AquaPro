import { Pipe, PipeTransform } from '@angular/core';
import { LayoutService } from '../services/layout.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  constructor(private layout: LayoutService) {}
  transform(key: string): string {
    return this.layout.t(key);
  }
}
