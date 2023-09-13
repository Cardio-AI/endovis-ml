import {Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {DataCounterNew} from "./model/DataCounterNew";
import {Occurrence} from "./model/Occurrence";

@Injectable({
  providedIn: 'root'
})
export class InstrumentSelectionService {
  private selection = new Subject<DataCounterNew<number, Occurrence[]>[]>();

  selection$ = this.selection.asObservable();

  constructor() {
  }

  updateSelection(selection: DataCounterNew<number, Occurrence[]>[]) {
    this.selection.next(selection);
  }

}
