import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  monoOneResultURL = '';
  monoOneInputURL = '';
  constructor(private http: HttpClient) { }

  ngOnInit() {
  }

  onFileChanged(e) {
    const file = e.target.files[0];
    console.log(file);
    const uploadData = new FormData();
    uploadData.append('pic', file, file.name);
    this.http.post('http://localhost:3000/backend/api/images', uploadData)
      .subscribe((res: any) => {
        const { outputPath, inputPath } = res;
        this.monoOneResultURL = outputPath;
        this.monoOneInputURL = inputPath;
      });
  }

}
