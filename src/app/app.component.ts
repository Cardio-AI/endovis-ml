import {Component} from '@angular/core';
import {DataService} from "./service/data.service";
import {DataParserService} from "./service/data-parser.service";
import {DataForwardService} from "./service/data-forward.service";
import * as d3 from 'd3';
import {CONSTANTS} from "./constants";
import {ParamFile} from "./model/ParamFile";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'endovis-ml';

  constructor(private dataService: DataService, private dataParserService: DataParserService, private dataForwardService: DataForwardService) {
  }

  // ngOnInit(): void {
  //   d3.select('#upload').on('input', e => {
  //
  //     // read parameter file
  //
  //     let p1 = new Promise((res,rej) => {
  //       let paramFile= Object.values(e.target.files as File[]).find(v => v.name === 'param.json')!;
  //
  //       let reader = new FileReader();
  //       reader.readAsText(paramFile, "UTF-8");
  //       reader.onload = (evt) => {
  //         this.setConstants(JSON.parse(evt.target!.result as string) as ParamFile);
  //         res(null);
  //       }
  //     }).then(() => {
  //
  //       console.log(CONSTANTS.phaseFileSuffix)
  //       console.log(CONSTANTS.instFileSuffix)
  //
  //
  //       // read phase data
  //       let phaseData = Object.values(e.target.files as File[]).filter((r: any) => new RegExp(`.+${CONSTANTS.phaseFileSuffix}`).test(r.name));
  //       let phaseList: FileUpload<string>[] = [];
  //       let p2 = phaseData.map(pFile => {
  //         return new Promise((res, rej) => {
  //           let reader = new FileReader();
  //           reader.readAsText(pFile, "UTF-8");
  //           reader.onload = (evt) => {
  //             console.log(pFile.name)
  //             phaseList.push({
  //               name: pFile.name,
  //               content: evt.target!.result as string
  //             });
  //             res(null)
  //           }
  //         });
  //       });
  //
  //
  //       // read instrument data
  //       let instData = Object.values(e.target.files as File[]).filter((r: any) => new RegExp(`.+${CONSTANTS.instFileSuffix}`).test(r.name));
  //       let instList: FileUpload<string>[] = [];
  //       let p3 = instData.map(iFile => {
  //         return new Promise((res, rej) => {
  //           let reader = new FileReader();
  //           reader.readAsText(iFile, "UTF-8");
  //           reader.onload = (evt) => {
  //             console.log(iFile.name)
  //             instList.push({
  //               name: iFile.name,
  //               content: evt.target!.result as string
  //             });
  //             res(null)
  //           }
  //         });
  //       });
  //
  //       // wait for all promises
  //       Promise.all([...p2, ...p3]).then(() => {
  //         let dataset = this.dataParserService.parseData(phaseList, instList);
  //         this.dataForwardService.updateDataset(dataset);
  //       });
  //     });
  //   });
  // }

  private setConstants(paramFile: ParamFile) {
    CONSTANTS.phaseFileSuffix = paramFile.phaseId;
    CONSTANTS.instFileSuffix = paramFile.instId;

    CONSTANTS.phaseMapping = d3.scaleOrdinal<string>()
      .domain(d3.range(paramFile.phaseLabels.length).map(String))
      .range(paramFile.phaseLabels);

    CONSTANTS.instrumentMapping = d3.scaleOrdinal<string>()
      .domain(d3.range(paramFile.instLabels.length + 1).map(String))
      .range([...paramFile.instLabels, CONSTANTS.idleLabel]);

    CONSTANTS.splits = paramFile.splits;

    CONSTANTS.testSplit = paramFile.testSplit;

  }

}
