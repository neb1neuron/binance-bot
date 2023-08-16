import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageType } from 'src/app/shared/enums/message-type.enum';
import { MESSAGE_INFO, SAVE_SUCCESS } from '../constants';

import { ToasterMessage, Toast, ToastOptions } from './toaster.service.models';

@Injectable({ providedIn: 'root' })
export class ToasterService {
  public toasts: Toast[] = [];

  private defaultOptions: ToastOptions = {
    autohide: true,
    show: true,
    delay: 5000
  };

  private readonly _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  public success (toasterMessage: ToasterMessage, options?: ToastOptions) {
    options = { ...this.defaultOptions };

    toasterMessage.title = toasterMessage.title ? toasterMessage.title : 'Success';
    const title = toasterMessage.title;

    let message: string = toasterMessage.body as string;
    message = !message ? SAVE_SUCCESS : message;

    this.addToast(title, message, options, MessageType.Success);
    this._toasts.next(this.toasts);
  }

  public info (toasterMessage: ToasterMessage, options?: ToastOptions) {
    options = { ...this.defaultOptions };

    toasterMessage.title = toasterMessage.title ? toasterMessage.title : 'Info';
    const title = toasterMessage.title;

    let message: string = toasterMessage.body as string;
    message = !message ? MESSAGE_INFO : message;

    this.addToast(title, message, options, MessageType.Info);
    this._toasts.next(this.toasts);
  }

  public warning (toasterMessage: ToasterMessage, options?: ToastOptions) {
    if (!options) {
      options = { ...this.defaultOptions };
    }

    toasterMessage.title = toasterMessage.title ? toasterMessage.title : 'Warning';
    const title = toasterMessage.title;
    const message: string = toasterMessage.body as string;

    this.addToast(title, message, options, MessageType.Warning);
    this._toasts.next(this.toasts);
  }

  public error (toasterMessage: ToasterMessage, options?: ToastOptions) {
    options = { ...this.defaultOptions };

    toasterMessage.title = toasterMessage.title ? toasterMessage.title : 'Error';
    const title = toasterMessage.title;
    const message: string = toasterMessage.body as string;

    this.addToast(title, message, options, MessageType.Error);
    this._toasts.next(this.toasts);
  }

  public remove (toast: Toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  public notImplementedToast (title: string) {
    this.warning({
      title: title,
      body: 'This feature is not implemented yet.',
    });
  }

  private addToast (title: string, message: string, options: ToastOptions, messageType: number) {
    const newToast: Toast = {
      // CONTENT
      header: title,
      body: message,

      // OTHER OPTIONS
      show: !!options.show,
      autohide: !!options.autohide,
      delay: options.delay,
      messageType: messageType
    };

    const hasDuplicates = this.toasts.some(toast => toast === newToast);
    if (!hasDuplicates) {
      this.toasts.push(newToast);
    }
  }
}
