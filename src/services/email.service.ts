import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) { }

  public send(action: string, message: string, send = false) {
    if (!send) {
      console.log('Email not sent! :', message);
      return;
    }
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.post('https://formspree.io/f/mbjvdoob',
      { name: `${action} binance notification`, replyto: 'bnbt@noreply.com', message: message },
      { 'headers': headers }).subscribe(
        response => {
          console.log(response);
        }
      );
  }
}
