import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {SurgeryData} from "../model/SurgeryData";
import {DataCounterNew} from "../model/DataCounterNew";
import {Occurrence} from "../model/Occurrence";

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private dataset = new Subject<SurgeryData[]>();
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

  // fix me: is merging actually necessary?
  // private mergeSelection(selection: DataCounterNew<number, Occurrence[]>[]){
  //   let result: DataCounterNew<number, Occurrence[]>[] = [];
  //
  //   let spsList = [...new Set(selection.map(e => e.object))];
  //
  //   spsList.forEach(spNr => { // for each sp
  //     let spOcc:Occurrence[] = selection.filter(e => e.object === spNr).flatMap(u => u.value).sort((a,b) => a.start - b.start);
  //
  //     let resSpObj: DataCounterNew<number, Occurrence[]> = {object: spNr, value: []}
  //
  //     let prevOcc = spOcc[0];
  //     spOcc.forEach(occ => {
  //       if(prevOcc.end >= occ.start) { // overlap
  //          prevOcc = {start: prevOcc.start, end: Math.max(prevOcc.end, occ.end)}
  //       } else { // no overlap
  //         resSpObj.value.push(prevOcc);
  //         prevOcc = occ;
  //       }
  //     });
  //
  //     // last element
  //     resSpObj.value.push(prevOcc);
  //     result.push(resSpObj);
  //   });
  //
  //   return result;
  // }
}
