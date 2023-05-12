import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {SurgeryData} from "../model/SurgeryData";

@Injectable({
  providedIn: 'root'
})
export class ExpandService {

  private expandedItem = new Subject<string | undefined>();

  expandedItem$ = this.expandedItem.asObservable();

  constructor() { }

  updateExpandedItem(expandedItem: string | undefined) {
    this.expandedItem.next(expandedItem);
  }
}
