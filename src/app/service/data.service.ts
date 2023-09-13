import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FileUpload} from "../model/FileUpload";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) {}

  // TODO: work with observables
  readLocalFiles(fileList: File[]): Promise<FileUpload<string>>[] {
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

  // getPhaseGroundTruth(): Observable<string>[] {
  //   return CONSTANTS.phaseAnnotations.map(filePath => this.http.get(filePath, { responseType: 'text' }))
  // }
  //
  // getInstrumentAnnot(): Observable<string>[] {
  //   return CONSTANTS.instAnnotations.map(filePath => this.http.get(filePath, { responseType: 'text' }))
  // }

}
