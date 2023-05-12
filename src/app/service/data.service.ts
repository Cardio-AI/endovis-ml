import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import * as d3 from 'd3';
import { Observable } from "rxjs";
import {CONSTANTS} from "../constants";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) {}

  getPhaseGroundTruth(): Observable<string>[] {
    return CONSTANTS.phaseAnnotations.map(filePath => this.http.get(filePath, { responseType: 'text' }))
  }

  getInstrumentAnnot(): Observable<string>[] {
    return CONSTANTS.instAnnotations.map(filePath => this.http.get(filePath, { responseType: 'text' }))
  }

  getPredictions(): Observable<string>[] {
    // let allFiles = d3.range(1, 81).map(num => `/data/dataset1/video${("0" + num).slice(-2)}-phase-pred.txt`);
    let allFiles = d3.range(1, 9).map(num => `/data/miccai/inst/Prokto${(num)}.csv`);
    return allFiles.map(filePath => this.http.get(filePath, { responseType: 'text' }))
  }
}
