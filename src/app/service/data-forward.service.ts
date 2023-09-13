import {Injectable} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";
import {CrossValSplit} from "../model/CrossValSplit";


// This service forwards the data to the set-assignment component
@Injectable({
  providedIn: 'root'
})
export class DataForwardService {

  dataset: SurgeryData[] = [];
  crossValSplits: CrossValSplit[] = [];
  testSet: number[] = [];

  constructor() { }
}
