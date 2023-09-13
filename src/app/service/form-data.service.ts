import {Injectable} from '@angular/core';
import {FileUpload} from "../model/FileUpload";
import {Delimiter} from "../enums/Delimiter";

@Injectable({
  providedIn: 'root'
})
export class FormDataService {

  selectedFiles: File[] = [];
  uploadedFiles: FileUpload<string>[] = [];
  delimiter: Delimiter = Delimiter.COMMA;
  phaseId: string = "";
  instId: string = "";
  phaseLabels: string = "";
  instLabels: string= "";
  crossValSplit: number[][][] = [[]];
  testSet: number[] = [];

  constructor() { }
}
