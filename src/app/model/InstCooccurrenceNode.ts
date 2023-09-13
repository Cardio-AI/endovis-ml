import {SimulationNodeDatum} from "d3-force";
import {DataCounterNew} from "./DataCounterNew";
import {DataCounterSelection} from "./DataCounterSelection";

export interface InstCooccurrenceNode<T,U> extends DataCounterSelection<T,U>, SimulationNodeDatum {

}
