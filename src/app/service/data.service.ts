import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FileUpload} from "../model/FileUpload";
import {Location} from "@angular/common"

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient, private location: Location) {}

  getLocalFiles(fileList: File[]): Promise<FileUpload<string>>[] {
    return fileList.map((file: File) => {
      return new Promise<FileUpload<string>>((res, rej) => {
        let reader: FileReader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            let result: FileUpload<string> = {
              name: file.name,
              content: reader.result
            }
            res(result);
          } else {
            rej('Unsupported file format')
          }
        }
        reader.onerror = rej
        reader.readAsText(file, "UTF-8");
      })
    });
  }

  getServerParamFile(): Promise<FileUpload<string>> {
    const paramFilePath = "/assets/param.json"

    return new Promise<FileUpload<string>>((res, rej) => {
      this.http.get(this.location.prepareExternalUrl(paramFilePath), {responseType: 'text'}).subscribe({
        next: resp => {
          let result: FileUpload<string> = {
            name: paramFilePath.split("/").slice(-1)[0],
            content: resp
          }
          res(result);
        },
        error: rej
      });
    });
  }

  getServerFiles(): Promise<FileUpload<string>>[] {
    let spIds = [...Array(60).keys()];
    spIds = spIds.map(n => n + 1);

    const phaseFiles = spIds.map(num => `/assets/video${("0" + num).slice(-2)}-phase.txt`);
    const instFiles = spIds.map(num => `/assets/video${("0" + num).slice(-2)}-tool.txt`);
    const allFiles = phaseFiles.concat(instFiles);

    return allFiles.map(filePath => {
      return new Promise<FileUpload<string>>((res, rej) => {
        this.http.get(this.location.prepareExternalUrl(filePath), {responseType: 'text'}).subscribe({
          next: resp => {
            let result: FileUpload<string> = {
              name: filePath.split("/").slice(-1)[0],
              content: resp
            }
            res(result);
          },
          error: rej
        });
      });
    });
  }

}
