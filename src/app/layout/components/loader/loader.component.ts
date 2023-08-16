import { Component, Input, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { OngoingRequestService } from 'src/app/shared/services/ongoing-requests/ongoing-request.service';
import { isEmptyObject } from 'src/app/shared/utils/utils';

@Component({
  selector: 'app-loader',
  templateUrl: 'loader.component.html',
  styleUrls: ['loader.component.scss'],
})
export class LoaderComponent implements OnInit {
  @Input() showAnimation = true;
  @Input() backgroundColorOpacity = '0.3';
  @Input() public set except(value: { [key: string]: { [key: string]: boolean } }) {
    this._except = value;
  }

  public get except() {
    return this._except;
  }

  @Input() public set only(value: { [key: string]: { [key: string]: boolean } }) {
    this._only = value;
  }

  public get only() {
    return this._only;
  }

  public showLoader = false;

  private _except: { [key: string]: { [key: string]: boolean } } = {}; // Show indicators on any request except requests made to one of these URLs
  private _only: { [key: string]: { [key: string]: boolean } } = {};   // If this is present it overrides except. Only if a request is made to one of these URLs is the indicator shown

  ngOnInit() {
    OngoingRequestService.ongoingRequests$
      .pipe(
        debounceTime(20)
      ).subscribe(({ payload: status, onSuccess }: any) => {
        if (!isEmptyObject(this.only)) {
          for (const request of Object.keys(this.only)) {
            const methods = status[request];

            if (methods) {
              for (const method of Object.keys(methods)) {
                if (status[request][method]) {
                  this.showLoader = true;
                  onSuccess?.(this.showLoader);
                  return;
                }
              }
            }
          }

          this.showLoader = false;
        } else {
          if (!isEmptyObject(this.except)) {
            for (const request of Object.keys(this.except)) {
              const methods = status[request];

              if (methods) {
                for (const method of Object.keys(methods)) {
                  if (status[request][method]) {
                    delete status[request][method];
                  }
                }
              }
            }
          }

          for (const request of Object.keys(status)) {
            const requestIsEmpty = isEmptyObject(status[request]);
            if (!requestIsEmpty) {
              this.showLoader = true;
              onSuccess?.(this.showLoader);
              return;
            } else {
              this.showLoader = false;
            }
          }
        }

        onSuccess?.(this.showLoader);
      });
  }
}
