import {Delimiter} from "../enums/Delimiter";

export interface ParamFile {
  separator: Delimiter;
  phaseId: string;
  instId: string;
  phaseLabels: string[];
  instLabels: string[];
  splits: Record<string, number[]>[];
  testSplit: number[];
}
