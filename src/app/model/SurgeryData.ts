import {PhaseAnnotationRow} from "./PhaseAnnotationRow";
import {Occurrence} from "./Occurrence";
import {DataCounterNew} from "./DataCounterNew";

export interface SurgeryData {
  spNr: number;
  spName: string;
  phaseData: PhaseAnnotationRow[];
  instData: Record<string, number>[];
  phaseIndex: Record<string, Occurrence[]>;
  phaseIndex2: DataCounterNew<string, Occurrence[]>[]
  instIndex: Record<string, Occurrence[]>;
  occIndex: DataCounterNew<Set<string>, Occurrence[]>[]
  set: string;
  predData?: PhaseAnnotationRow[];
  predIndex?: Map<number, Occurrence[]>;
  duration: number;
}
