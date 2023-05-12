import {DataCounterNew} from "./DataCounterNew";
import {Occurrence} from "./Occurrence";

export interface DataCounterSelection<T,U> extends DataCounterNew<T, U> {
  originalData: DataCounterNew<number, Occurrence[]>[];
}
