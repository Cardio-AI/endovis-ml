import {Component, OnInit} from '@angular/core';
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {DataForwardService} from "../service/data-forward.service";
import {LabelDataService} from "../service/label-data.service";
import {Router} from "@angular/router";
import { CONSTANTS } from '../constants';
import * as d3 from "d3";

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(private dataService:DataService,
              private labelDataService: LabelDataService,
              private dataParserService:DataParserService,
              private router: Router,
              private dataForwardService:DataForwardService) { }

  ngOnInit(): void {
  }

  load_sample_data() {
    const paramFilePromise = this.dataService.getServerParamFile();

    paramFilePromise.then((file) => {
      const paramFile = this.dataParserService.parseParamFile(file);

      // store labels (overlap with process_files() in upload.component)
      this.labelDataService.phaseLabels = paramFile.phaseLabels;
      CONSTANTS.phaseMapping = d3.scaleOrdinal<string>()
        .domain(d3.range(this.labelDataService.phaseLabels.length).map(String))
        .range(this.labelDataService.phaseLabels);

      CONSTANTS.phaseMappingInverse = d3.scaleOrdinal<string>()
        .domain(CONSTANTS.phaseMapping.range())
        .range(CONSTANTS.phaseMapping.domain());

      this.labelDataService.instLabels = paramFile.instLabels;
      const instCopy = [...this.labelDataService.instLabels, CONSTANTS.idleLabel]
      CONSTANTS.instrumentMapping = d3.scaleOrdinal<string>()
        .domain(d3.range(instCopy.length).map(String))
        .range(instCopy);
      
      CONSTANTS.instrumentMappingInverse = d3.scaleOrdinal<string>()
        .domain(CONSTANTS.instrumentMapping.range())
        .range(CONSTANTS.instrumentMapping.domain());

      return paramFile;
    }).then(paramFile => {
      const promises = this.dataService.getServerFiles();


      Promise.all(promises).then(fileList => {
        const fileMatches = this.dataParserService.matchPhaseAndInstFiles(fileList, paramFile.phaseId, paramFile.instId);

        let dataset = fileMatches.map(([phaseFile, instFile]) => {
          return this.dataParserService.parseData(phaseFile, instFile, paramFile.phaseId, paramFile.delimiter);
        });

        this.dataForwardService.dataset = dataset;
        this.dataForwardService.crossValSplits = paramFile.crossValSplits;
        this.dataForwardService.testSet = paramFile.testSplit;

        // go to the train-val component
        this.router.navigate(['/train-test']);
      });
    });
  }

}
