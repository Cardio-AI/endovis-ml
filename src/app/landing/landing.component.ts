import {Component, OnInit} from '@angular/core';
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {DataForwardService} from "../service/data-forward.service";
import {LabelDataService} from "../service/label-data.service";
import {Router} from "@angular/router";

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

      // store labels
      this.labelDataService.phaseLabels = paramFile.phaseLabels;
      this.labelDataService.instLabels = paramFile.instLabels;

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
