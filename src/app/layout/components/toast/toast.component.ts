import { Component } from '@angular/core';
import { MessageType } from 'src/app/shared/enums/message-type.enum';
import { Toast } from 'src/app/layout/components/toast/core/service/toaster.service.models';
import { ToasterService } from './core/service/toaster.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  public messageTypes = MessageType;
  private removeTimeoutId?: number | NodeJS.Timeout;

  public getIcon = (type: MessageType) => {
    switch (type) {
      case this.messageTypes.Success:
        return 'check_circle';
      case this.messageTypes.Info:
        return 'info';
      case this.messageTypes.Error:
        return 'error';
      case this.messageTypes.Warning:
        return 'warning';
    }
  };

  constructor(
    public toastService: ToasterService
  ) {
  }

  public cancelAutohide (toast: Toast) {
    toast.autohide = false;
    toast.show = true;

    clearTimeout(this.removeTimeoutId);
  }

  public autohide (toast: Toast) {
    toast.autohide = true;
    toast.show = false;

    this.removeTimeoutId = setTimeout(() => {
      this.toastService.remove(toast);
    }, 1000);
  }
}
