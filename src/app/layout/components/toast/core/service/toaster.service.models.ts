import { BackEndError } from '../../../../../shared/interfaces/errors/back-end-error';

export interface ToasterMessage {
  type?: number;
  title: string;
  body?: string;
  error?: Partial<BackEndError>;
}

export interface ToastOptions {
  show?: boolean;
  autohide?: boolean;
  delay?: number;
}

export interface Toast {
  header: string;
  body: string;
  show: boolean;
  autohide: boolean;
  delay?: number;
  messageType: number;
}

export class ToasterDisplayModel {
  successModel: ToasterMessage;
  errorModel: ToasterMessage;

  constructor(
    successModel: ToasterMessage,
    errorModel: ToasterMessage
  ) {
    this.successModel = successModel;
    this.errorModel = errorModel;
  }
}

