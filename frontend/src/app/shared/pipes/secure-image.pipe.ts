import { Pipe, PipeTransform, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'secureImage',
  standalone: true
})
export class SecureImagePipe implements PipeTransform {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  transform(url: string | undefined): Observable<SafeUrl> {
    if (!url) return of('');
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5075${url}`;

    return this.http.get(fullUrl, { responseType: 'blob' }).pipe(
      map(val => this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(val))),
      catchError(() => of(''))
    );
  }
}
