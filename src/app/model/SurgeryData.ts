import {Occurrence} from "./Occurrence";
import {DataCounterNew} from "./DataCounterNew";
import {AnnotationRow} from "./AnnotationRow";

export interface SurgeryData {
  spNr: number;
  spName: string;

  // phaseData: PhaseAnnotationRow[]; // csv row
  // instData: InstAnnotationRow[]; //csv rows
  parsedData: AnnotationRow[]; // csv rows

  phaseIndex: Record<string, Occurrence[]>; // TODO: use DataCounterNew instead?
  instIndex: Record<string, Occurrence[]>; // TODO: use DataCounterNew instead?
  occIndex: DataCounterNew<Set<string>, Occurrence[]>[];

  set: string | undefined;
}
