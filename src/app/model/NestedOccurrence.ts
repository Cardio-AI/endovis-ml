import {Occurrence} from "./Occurrence";
import {DataCounterNew} from "./DataCounterNew";

export interface NestedOccurrence<T> extends Occurrence {
  nestedOccurrences: DataCounterNew<T, Occurrence[]>[]

}
