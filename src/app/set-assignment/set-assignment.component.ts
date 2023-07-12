import {Component, OnInit} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import * as d3 from "d3";
import {DataSharingService} from "../service/data-sharing.service";
import {CONSTANTS} from "../constants";
import {DataForwardService} from "../service/data-forward.service";

@Component({
  selector: 'app-set-assignment',
  templateUrl: './set-assignment.component.html',
  styleUrls: ['./set-assignment.component.css']
})
export class SetAssignmentComponent implements OnInit {

  localDatasetCopy: SurgeryData[] = [];
  private selection: SurgeryData[] = []

  selectedSplit = 0;

  localSplitsCopy = CONSTANTS.splits;

  constructor(private dataForwardService: DataForwardService, private dataSharingService: DataSharingService) {
  }

  ngOnInit(): void {
    console.log('SET-ASSIGNMENT CREATED');

    this.localDatasetCopy = this.dataForwardService.dataset;
    this.dataSharingService.updateDataset(this.localDatasetCopy.filter(s => s.set !== 'unassigned'))

    d3.select('#reset-selection').on('click', e => {
      this.assignData();
      this.dataSharingService.updateDataset(this.localDatasetCopy);
      // this.dataSharingService.updateSelection([]);
    });

    d3.select('#set-assignment-select').on('change', e => {
      this.selectedSplit = d3.select(e.currentTarget).property('value');
      this.assignData();
      this.dataSharingService.updateDataset(this.localDatasetCopy);
      this.dataSharingService.updateSelection([]);
    });

    d3.select('#set-assignment-prev').on('click', e => {
      if(this.selectedSplit === 0) {
        this.selectedSplit = this.localSplitsCopy.length - 1
      } else {
        this.selectedSplit--;
      }
      this.assignData();
      this.dataSharingService.updateDataset(this.localDatasetCopy.filter(s => s.set !== 'unassigned'));
      this.dataSharingService.updateSelection([]);
    });

    d3.select('#set-assignment-next').on('click', e => {
      if(this.selectedSplit === this.localSplitsCopy.length - 1) {
        this.selectedSplit = 0
      } else {
        this.selectedSplit++;
      }
      this.assignData();
      this.dataSharingService.updateDataset(this.localDatasetCopy.filter(s => s.set !== 'unassigned'));
      this.dataSharingService.updateSelection([]);
    });

    // this.dataSharingService.dataset$.subscribe(dataset => {
    //   this.dataset = dataset;
    //   // d3.select('.all-data .dataset-col-content')
    //   //   .selectAll('.all-data-item')
    //   //   .data(dataset)
    //   //   .join(
    //   //     enter => {
    //   //       let mainDiv = enter.append('div')
    //   //         // .attr('draggable', true)
    //   //         // .attr('ondragstart', 'drag(event)')
    //   //         .style('background-color', '#ffffd1')
    //   //         .style('border', '1px solid #808240');
    //   //       mainDiv.append('div')
    //   //         .style('font-size', '10pt')
    //   //         .text(d => `video${d.spNr}-phase.txt`);
    //   //       mainDiv.append('div')
    //   //         .style('font-size', '8pt')
    //   //         .text(d => `${d.duration} frames`);
    //   //
    //   //       // @ts-ignore
    //   //       mainDiv.call(d3.drag().on('end', (e,d) => {
    //   //         console.log(e.x)
    //   //         console.log(e.y)
    //   //         // @ts-ignore
    //   //         console.log(d3.select('.dataset-column.train'))
    //   //       }));
    //   //       mainDiv.on('mouseover', function () { d3.select(this).style('opacity', 0.5) })
    //   //         .on('mouseout', function () { d3.select(this).style('opacity', 1) })
    //   //       return mainDiv;
    //   //     }
    //   //   )
    // })
  }

  dragstart(e: DragEvent, sp: SurgeryData) {
    if(e.target) {
      this.selection.push(sp);
    }
  }

  dragover(e: DragEvent) {
    e.preventDefault()
  }

  assignToDataset(e: DragEvent, datasetName: string) {
    this.selection.forEach(s => s.set = datasetName);
    this.localDatasetCopy = [...this.localDatasetCopy]; // necessary for angular to detect changes
    this.dataSharingService.updateDataset(this.localDatasetCopy.filter(s => s.set !== 'unassigned'));
    this.selection = [];
  }

  dragend(e: DragEvent) {
    this.selection = [];
  }

  private assignData() {
    this.localDatasetCopy.forEach(sp => {
      sp.set = CONSTANTS.datasets.filter(d => d !== 'test').find(set => CONSTANTS.splits[this.selectedSplit][set].includes(sp.spNr)) || (CONSTANTS.testSplit.includes(sp.spNr) ? 'test' : 'unassigned');
    })
    this.localDatasetCopy = [...this.localDatasetCopy]; // necessary for angular to detect changes
  }

}
