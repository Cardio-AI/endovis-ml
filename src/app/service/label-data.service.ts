import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LabelDataService {

  phaseLabels: string[] = [];
  instLabels: string[] = [];

  constructor() { }
}
