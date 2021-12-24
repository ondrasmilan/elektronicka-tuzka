import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  // API url
  baseApiUrl = 'https://file.io';

  constructor(private http: HttpClient) {}

  // Returns an observable
  upload(file: File, destination: string): Observable<any> {
    // Create form data
    if (!file) throw 'Failed to get file!';
    //console.log(file.stream);
    const formData = new FormData();

    // Store form name as "file" with file data
    formData.append('file', file, file.name);

    // Make http post request over api
    // with formData as req
    return this.http.post(destination, formData);
  }
}
