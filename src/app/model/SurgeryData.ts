import {PhaseAnnotationRow} from "./PhaseAnnotationRow";
import {Occurrence} from "./Occurrence";
import {DataCounterNew} from "./DataCounterNew";

export interface SurgeryData {
  spNr: number;
  spName: string;
  phaseData: PhaseAnnotationRow[]; // csv row
  instData: Record<string, number>[]; //csv rows
  phaseIndex: Record<string, Occurrence[]>; // TODO: use DataCounterNew instead?
  phaseIndex2: DataCounterNew<string, Occurrence[]>[];
  instIndex: Record<string, Occurrence[]>; // TODO: use DataCounterNew instead?
  occIndex: DataCounterNew<Set<string>, Occurrence[]>[]
  set: string;
  duration: number; // TODO: get length of phaseData or instData?
}
