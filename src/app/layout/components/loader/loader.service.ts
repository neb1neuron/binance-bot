import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private loaderSubject$ = new BehaviorSubject<boolean>(false);

  getLoader () {
    return this.loaderSubject$;
  }

  show () {
    this.loaderSubject$.next(true);
  }

  hide () {
    this.loaderSubject$.next(false);
  }
}
