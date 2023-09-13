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

  public static phaseMapping = d3.scaleOrdinal<string>()
    .domain(d3.range(7).map(String))
    .range([
      'Preparation',
      'Calot triangle dissection',
      'Clipping cutting',
      'Gallbladder dissection',
      'Gallbladder packaging',
      'Cleaning coagulation',
      'Gallbladder retraction']);

  // public static phaseMapping = d3.scaleOrdinal<string>()
  //   .domain(d3.range(14).map(String))
  //   .range([
  //     'Preparation and orientation at abdomen',
  //     'Dissection of lymphnodes and blood vessels',
  //     'Retroperitoneal preparation to lower pancreatic border',
  //     'Retroperitoneal preparation of duodenum and pancreatic head',
  //     'Mobilizing the sigmoid and the descending colon',
  //     'Mobilizing the spenic flexure',
  //     'Mobilizing the tranverse colon',
  //     'Mobilizing the ascending colon',
  //     'Dissection and resection of rectum',
  //     'Preparing the anastomosis extra- abdominally',
  //     'Preparing the anastomosis intra- abdominally',
  //     'Placing stoma',
  //     'Finishing the operation',
  //     'Exception']);

  public static phaseMappingInverse = d3.scaleOrdinal()
    .domain(CONSTANTS.phaseMapping.range())
    .range(CONSTANTS.phaseMapping.domain());

  public static idleLabel = 'Idle';

  public static instrumentMapping = d3.scaleOrdinal<string>()
    .domain(d3.range(8).map(String))
    .range([
      'Grasper',
      'Bipolar',
      'Hook',
      'Scissors',
      'Clipper',
      'Irrigator',
      'SpecimenBag',
      CONSTANTS.idleLabel]);

  // public static instrumentMapping = d3.scaleOrdinal<string>()
  //   .domain(d3.range(13).map(String))
  //   .range([
  //     'Grasper',
  //     'HarmonicScalpel',
  //     'J-hook',
  //     'Ligasure',
  //     'Scissors',
  //     'Stapler',
  //     'Aspirator',
  //     'Swapholder',
  //     'SiliconeDrain',
  //     'Clipper',
  //     'I-Hook',
  //     'NeedleHolder',
  //     CONSTANTS.idleLabel
  //   ]);

  public static instrumentMappingInverse = d3.scaleOrdinal<string>()
    .domain(CONSTANTS.instrumentMapping.range())
    .range(CONSTANTS.instrumentMapping.domain());
}
