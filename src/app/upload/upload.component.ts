import {Component, OnInit} from '@angular/core';
import {FileUpload} from "../model/FileUpload";
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {Delimiter} from "../enums/Delimiter";
import {Split} from "../enums/Split";
import {Router} from "@angular/router";
import {DataForwardService} from "../service/data-forward.service";
import {FormDataService} from "../service/form-data.service";
import {LabelDataService} from "../service/label-data.service";
import {CrossValSplit} from "../model/CrossValSplit";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  allDelimiters = Object.values(Delimiter);
  processing = false;

  constructor(private formDataService: FormDataService,
              private dataService: DataService,
              private labelDataService: LabelDataService,
              private dataParserService: DataParserService,
              private router: Router,
              private dataForwardService: DataForwardService) {
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

      const promises = this.dataService.getLocalFiles(this.selectedFiles);

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

    this.delimiter = parsedParamFile.delimiter;
    this.phaseId = parsedParamFile.phaseId;
    this.instId = parsedParamFile.instId;
    this.phaseLabels = parsedParamFile.phaseLabels.toString();
    this.instLabels = parsedParamFile.instLabels.toString();
    this.crossValSplit = parsedParamFile.crossValSplits;
    this.testSet = parsedParamFile.testSplit;
  }

  addSplit() {
    this.crossValSplit.push({train: [], validation: []}); // add empty row
  }

  removeSplit() {
    if (this.crossValSplit.length > 1) {
      this.crossValSplit.pop();
    }
  }

  processFiles() {
    this.processing = true;

    new Promise(() => {

      // match phase and instrument files
      const fileMatches = this.dataParserService.matchPhaseAndInstFiles(this.uploadedFiles, this.phaseId, this.instId);

      // parse
      this.labelDataService.phaseLabels = this.dataParserService.splitString(this.phaseLabels)
      this.labelDataService.instLabels = this.dataParserService.splitString(this.instLabels);

      let dataset = fileMatches.map(([phaseFile, instFile]) => {
        return this.dataParserService.parseData(phaseFile, instFile, this.phaseId, this.delimiter);
      });

      this.dataForwardService.dataset = dataset.sort((a,b) => a.spNr - b.spNr);
      this.dataForwardService.crossValSplits = this.crossValSplit;
      this.dataForwardService.testSet = this.testSet;

      // go to the train-val component
      this.router.navigate(['/train-test']);
    });
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

  get crossValSplit(): CrossValSplit[] {
    return this.formDataService.crossValSplit;
  }

  set crossValSplit(value: CrossValSplit[]) {
    this.formDataService.crossValSplit = value;
  }

  get testSet(): number[] {
    return this.formDataService.testSplit;
  }

  set testSet(value: number[]) {
    this.formDataService.testSplit = value;
  }

  protected readonly Split = Split;
}
