import {Component, OnInit} from '@angular/core';
import {DataService} from "../service/data.service";
import {DataParserService} from "../service/data-parser.service";
import {DataForwardService} from "../service/data-forward.service";

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(private dataService:DataService, private dataParserService:DataParserService, private dataForwardService:DataForwardService) { }

  ngOnInit(): void {
  }

  load_sample_data() {
    // forkJoin(this.dataService.getPhaseGroundTruth()).subscribe(phaseData => {
    //   forkJoin(this.dataService.getInstrumentAnnot()).subscribe(instData => {
    //     let dataset = this.dataParserService.parseData(phaseData,instData);
    //     this.dataForwardService.updateDataset(dataset);
    //   })
    // })
  }

}
