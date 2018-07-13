import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SERVER_ADDR } from '../../../../config.js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  monoOneResultURL = '';
  monoOneInputURL = '';
  monoVideoResultUrl = '';
  loading = false;
  SERVER_ADDR = SERVER_ADDR;


  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  onFileChanged(e) {
    const file = e.target.files[0];
    this.monoOneInputURL = this.monoOneResultURL = this.monoVideoResultUrl = '';
    const uploadData = new FormData();
    uploadData.append('upload', file, file.name);
    this.loading = true;
    this.http.post(`http://${SERVER_ADDR}/backend/api/upload`, uploadData)
      .subscribe((res: any) => {
        const { outputPath, inputPath, isVideo } = res;
        if (isVideo) {
          this.monoVideoResultUrl = outputPath;
        } else {
          this.monoOneResultURL = outputPath;
          this.monoOneInputURL = inputPath;
        }
        this.loading = false;
      });
  }

}
