import * as d3 from 'd3';

export class CONSTANTS {
  public static datasets = ['train', 'validation', 'test'];

  public static datasetColors = d3.scaleOrdinal<string, string>()
    .domain(CONSTANTS.datasets)
    .range(["#fbb4ae", "#ccebc5", "#b3cde3"]); // "#fc8d62", "#66c2a5", "#8da0cb" or "#ffd3b3", "#bce7bb", "#b4b3ff"

  public static columnNames = {
    phase: 'Phase',
    frame: 'Frame'
  }

  public static phaseMapping = d3.scaleOrdinal<string>();

  public static phaseMappingInverse = d3.scaleOrdinal()
    .domain(CONSTANTS.phaseMapping.range())
    .range(CONSTANTS.phaseMapping.domain());

  public static idleLabel = 'Idle';

  public static instrumentMapping = d3.scaleOrdinal<string>();

  public static instrumentMappingInverse = d3.scaleOrdinal<string>()
    .domain(CONSTANTS.instrumentMapping.range())
    .range(CONSTANTS.instrumentMapping.domain());
}
