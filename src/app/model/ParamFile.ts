import {Delimiter} from "../enums/Delimiter";
import {CrossValSplit} from "./CrossValSplit";

export interface ParamFile {
  delimiter: Delimiter;
  phaseId: string;
  instId: string;
  phaseLabels: string[];
  instLabels: string[];
  crossValSplits: CrossValSplit[];
  testSplit: number[];
}
