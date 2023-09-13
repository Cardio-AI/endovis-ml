import {Injectable} from '@angular/core';
import {FileUpload} from "../model/FileUpload";
import {Delimiter} from "../enums/Delimiter";
import {CrossValSplit} from "../model/CrossValSplit";

@Injectable({
  providedIn: 'root'
})
export class FormDataService {

  selectedFiles: File[] = [];
  uploadedFiles: FileUpload<string>[] = [];
  // paramFile: ParamFile;
  delimiter: Delimiter = Delimiter.COMMA;
  phaseId: string = "";
  instId: string = "";
  phaseLabels: string = "";
  instLabels: string= "";
  crossValSplit: CrossValSplit[] = [{train: [], validation: []}];
  testSplit: number[] = [];

  constructor() { }
}
