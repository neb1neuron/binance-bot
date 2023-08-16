import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileReaderService {

  constructor(private httpClient: HttpClient) { }

  async readLocalFile(path: string) {
    return lastValueFrom(this.httpClient.get(path, { responseType: 'text' }));
  }

}
