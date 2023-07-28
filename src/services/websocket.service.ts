import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  ws: any;
  constructor() { }

  public connect(url: string): any {
    let message = new BehaviorSubject<any>(null);
    if (!this.ws) {
      this.ws = webSocket(url);
    } else {
      this.ws.unsubscribe();
      this.ws = webSocket(url);
    }
    this.ws.subscribe({
      next: (msg: any) => message.next(msg),
      error: (err: any) => console.log(err),
      complete: () => console.log('websocket connection closed')
    });

    return message;
  }

  public disconnect() {
    this.ws.unsubscribe();
  }


}
