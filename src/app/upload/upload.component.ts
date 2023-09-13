import {Component, OnInit} from '@angular/core';
import {FileUpload} from "../model/FileUpload";
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {Delimiter} from "../enums/Delimiter";
import {Split} from "../enums/Split";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  selectedFiles: File[] = [];
  uploadedFiles: FileUpload<string>[] = [];
  separator: Delimiter = Delimiter.COMMA;
  phaseId: string = "";
  instId: string = "";
  phaseLabels: string = "";
  instLabels: string= "";
  crossValSplit: number[][][] = [[]];
  testSet: number[] = [];

  //
  separators = Object.values(Delimiter);

  constructor(private dataService: DataService, private dataParserService: DataParserService) { }

  ngOnInit(): void {
  }

  readFiles(event: Event) {
    // reset lists of files
    this.selectedFiles = [];
    this.uploadedFiles = [];

    const fileList = (event.target as HTMLInputElement).files;
    if (fileList) {
      this.selectedFiles = Array.from(fileList);

      const promises = this.dataService.readLocalFiles(this.selectedFiles);

      // Promise.all(promises).then(() => this.processFiles())

      promises.forEach((promise: Promise<FileUpload<string>>) => {
        promise.then((file: FileUpload<string>) => {
          if (file.name === 'param.json') {
            this.processParamFile(file)
          }
          this.uploadedFiles.push(file);
        });
      });
    } else {
      throw new Error('No files provided');
    }
  }

  private processParamFile(file: FileUpload<string>) {
    const parsedParamFile = this.dataParserService.parseParamFile(file);

      if(parsedParamFile) {
        this.separator = parsedParamFile.separator;
        this.phaseId = parsedParamFile.phaseId;
        this.instId = parsedParamFile.instId;
        this.phaseLabels = parsedParamFile.phaseLabels.toString();
        this.instLabels = parsedParamFile.instLabels.toString();
        this.crossValSplit = parsedParamFile.splits.map(split => [split[Split.Training], split[Split.Validation]])
        this.testSet = parsedParamFile.testSplit;
      } else {
        throw new Error("Provided param.json file is not valid")
      }
  }

  addSplit() {
    this.crossValSplit.push([]);
  }

  removeSplit() {
    if (this.crossValSplit.length > 1) {
      this.crossValSplit.pop();
    }
  }

  processFiles() {
    // match phase and instrument files
    const fileMatches = this.dataParserService.matchPhaseAndInstFiles(this.uploadedFiles, this.phaseId, this.instId);

    // parse
    const phaseLabelsArray = this.dataParserService.splitString(this.phaseLabels);
    const instLabelsArray = this.dataParserService.splitString(this.instLabels);

    let dataset = fileMatches.map(([phaseFile, instFile]) => {
      return this.dataParserService.parseData(phaseFile, instFile, this.phaseId, this.separator, instLabelsArray);
    });

    // go to train-val
    console.log(dataset)
  }

}
