import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {SurgeryData} from "../model/SurgeryData";
import {DataCounterNew} from "../model/DataCounterNew";
import {Occurrence} from "../model/Occurrence";

@Injectable({
  providedIn: 'root'
})
export class DataForwardService {

  private dataset = new Subject<SurgeryData[]>();

  dataset$ = this.dataset.asObservable();

  constructor() { }

  updateDataset(dataset: SurgeryData[]) {
    this.dataset.next(dataset);
  }
}
