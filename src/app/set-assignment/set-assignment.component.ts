import {Component, OnInit} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import * as d3 from "d3";
import {DataSharingService} from "../service/data-sharing.service";
import {DataForwardService} from "../service/data-forward.service";
import {Split} from "../enums/Split";

@Component({
  selector: 'app-set-assignment',
  templateUrl: './set-assignment.component.html',
  styleUrls: ['./set-assignment.component.css']
})
export class SetAssignmentComponent implements OnInit {

  localDatasetCopy: SurgeryData[] = [];
  private selection: SurgeryData[] = []

  selectedSplit = 0;

  localSplitsCopy = this.dataForwardService.crossValSplits;

  constructor(private dataForwardService: DataForwardService, private dataSharingService: DataSharingService) {
  }

  ngOnInit(): void {
    this.localDatasetCopy = this.dataForwardService.dataset;
    this.dataSharingService.updateDataset(this.localDatasetCopy.filter(s => s.set))

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
      sp.set = this.dataForwardService.crossValSplits[this.selectedSplit][Split.Training].has(sp.spNr) ?
        Split.Training : this.dataForwardService.crossValSplits[this.selectedSplit][Split.Validation].has(sp.spNr) ?
          Split.Validation : this.dataForwardService.testSet.has(sp.spNr) ? Split.Test : undefined;
    });
    this.localDatasetCopy = [...this.localDatasetCopy]; // necessary for angular to detect changes
  }

}
