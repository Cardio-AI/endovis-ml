import {Component, OnInit} from '@angular/core';
import {FileUpload} from "../model/FileUpload";
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {Delimiter} from "../enums/Delimiter";
import {Split} from "../enums/Split";
import {Router} from "@angular/router";
import {DataForwardService} from "../service/data-forward.service";
import {FormDataService} from "../service/form-data.service";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  allDelimiters = Object.values(Delimiter);
  constructor(private formDataService: FormDataService, private dataService: DataService, private dataParserService: DataParserService, private router: Router, private dataForwardService: DataForwardService) {
  }

  ngOnInit(): void {
  }

  readFiles(event: Event) {
    // reset lists of files
    this.formDataService.selectedFiles = [];
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
        this.delimiter = parsedParamFile.separator;
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
      return this.dataParserService.parseData(phaseFile, instFile, this.phaseId, this.delimiter, instLabelsArray);
    });

    // go to train-val
    this.dataForwardService.dataset = dataset;

    this.router.navigate(['/train-test']);
  }

  // get and set methods
  get selectedFiles(): File[] {
    return this.formDataService.selectedFiles;
  }

  set selectedFiles(value: File[]) {
    this.formDataService.selectedFiles = value;
  }

  get uploadedFiles(): FileUpload<string>[] {
    return this.formDataService.uploadedFiles;
  }

  set uploadedFiles(value: FileUpload<string>[]) {
    this.formDataService.uploadedFiles = value;
  }

  get delimiter(): Delimiter {
    return this.formDataService.delimiter;
  }

  set delimiter(value: Delimiter) {
    this.formDataService.delimiter = value;
  }

  get phaseId(): string {
    return this.formDataService.phaseId;
  }

  set phaseId(value: string) {
    this.formDataService.phaseId = value;
  }

  get instId(): string {
    return this.formDataService.instId;
  }

  set instId(value: string) {
    this.formDataService.instId = value;
  }

  get phaseLabels(): string {
    return this.formDataService.phaseLabels;
  }

  set phaseLabels(value: string) {
    this.formDataService.phaseLabels = value;
  }

  get instLabels(): string {
    return this.formDataService.instLabels;
  }

  set instLabels(value: string) {
    this.formDataService.instLabels = value;
  }

  get crossValSplit(): number[][][] {
    return this.formDataService.crossValSplit;
  }

  set crossValSplit(value: number[][][]) {
    this.formDataService.crossValSplit = value;
  }

  get testSet(): number[] {
    return this.formDataService.testSet;
  }

  set testSet(value: number[]) {
    this.formDataService.testSet = value;
  }

}
