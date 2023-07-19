import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from "rxjs";
import {SurgeryData} from "../model/SurgeryData";
import {DataCounterNew} from "../model/DataCounterNew";
import {Occurrence} from "../model/Occurrence";

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private dataset = new ReplaySubject<SurgeryData[]>(1);
  private selection = new Subject<DataCounterNew<number, Occurrence[]>[]>()

  dataset$ = this.dataset.asObservable();

  selection$ = this.selection.asObservable();

  constructor() { }

  updateDataset(dataset: SurgeryData[]) {
    this.dataset.next(dataset);
  }

  updateSelection(selection: DataCounterNew<number, Occurrence[]>[]) {
    this.selection.next(selection);
  }
}
