import * as d3 from 'd3';

export class CONSTANTS {
  public static datasets = ['train', 'validation', 'test'];

  // public static phaseFileSuffix: string;
  // public static instFileSuffix: string;

  // public static phaseAnnotations = d3.range(1, 9).map(num => `/data/miccai/Prokto${(num)}.csv`);
  // public static phaseAnnotations = d3.range(1, 81).map(num => `/sample_dataset/video${("0" + num).slice(-2)}_phase.csv`);

  // public static instAnnotations = d3.range(1, 9).map(num => `/data/miccai/inst/Prokto${(num)}.csv`);
  // public static instAnnotations = d3.range(1, 81).map(num => `/sample_dataset/video${("0" + num).slice(-2)}_tool.csv`);

  public static instFrameStep = 25;

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

  // public static splits: Record<string, number[]>[] = [
  //   {
  //     "train": [79, 31, 14, 39, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 7, 72, 41, 28, 59, 26, 74, 21, 48, 11, 77, 42, 61, 34, 73, 0, 55, 3, 12, 46, 64, 4],
  //     "validation": [78, 1, 50, 5, 24, 13, 65, 22, 49]
  //   },
  //   {
  //     "train": [1, 50, 5, 24, 13, 65, 22, 49, 30, 56, 35, 17, 51, 67, 9, 7, 72, 41, 28, 59, 26, 64, 74, 48, 11, 77, 42, 61, 34, 73, 0, 3, 12, 78, 21, 55],
  //     "validation": [79, 31, 4, 14, 39, 46, 25, 47, 69]
  //   },
  //   {
  //     "train": [78, 1, 50, 5, 24, 13, 65, 22, 49, 79, 4, 14, 46, 25, 47, 69, 41, 28, 59, 26, 64, 21, 48, 11, 77, 42, 61, 34, 73, 0, 55, 3, 12, 39, 74, 31],
  //     "validation": [30, 56, 35, 17, 51, 67, 9, 7, 72]
  //   },
  //   {
  //     "train": [78, 1, 5, 24, 13, 65, 22, 49, 79, 31, 4, 14, 39, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 72, 77, 42, 61, 34, 73, 0, 55, 3, 12, 50, 46, 7],
  //     "validation": [41, 28, 59, 26, 64, 74, 21, 48, 11]
  //   },
  //   {
  //     "train": [78, 1, 50, 5, 13, 65, 22, 49, 79, 31, 4, 14, 39, 46, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 72, 41, 28, 26, 64, 74, 21, 48, 11, 24, 7, 59],
  //     "validation": [77, 42, 61, 34, 73, 0, 55, 3, 12]
  //   }
  // ]

  // public static splits: Record<string, number[]>[] = [
  //   {
  //     "train": [79, 31, 14, 39, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 7, 72, 41, 28, 59, 26, 74, 21, 48, 11, 77, 42, 61, 34, 73, 0, 55, 3, 12, 46, 64, 4],
  //     "validation": [78, 1, 50, 5, 24, 13, 65, 22, 49]
  //   },
  //   {
  //     "train": [1, 50, 5, 24, 13, 65, 22, 49, 30, 56, 35, 17, 51, 67, 9, 7, 72, 41, 28, 59, 26, 64, 74, 48, 11, 77, 42, 61, 34, 73, 0, 3, 12, 78, 21, 55],
  //     "validation": [79, 31, 4, 14, 39, 46, 25, 47, 69]
  //   },
  //   {
  //     "train": [78, 1, 50, 5, 24, 13, 65, 22, 49, 79, 4, 14, 46, 25, 47, 69, 41, 28, 59, 26, 64, 21, 48, 11, 77, 42, 61, 34, 73, 0, 55, 3, 12, 39, 74, 31],
  //     "validation": [30, 56, 35, 17, 51, 67, 9, 7, 72]
  //   },
  //   {
  //     "train": [78, 1, 5, 24, 13, 65, 22, 49, 79, 31, 4, 14, 39, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 72, 77, 42, 61, 34, 73, 0, 55, 3, 12, 50, 46, 7],
  //     "validation": [41, 28, 59, 26, 64, 74, 21, 48, 11]
  //   },
  //   {
  //     "train": [78, 1, 50, 5, 13, 65, 22, 49, 79, 31, 4, 14, 39, 46, 25, 47, 69, 30, 56, 35, 17, 51, 67, 9, 72, 41, 28, 26, 64, 74, 21, 48, 11, 24, 7, 59],
  //     "validation": [77, 42, 61, 34, 73, 0, 55, 3, 12]
  //   }
  // ]

  public static splits: Record<string, number[]>[] = [
      {
        "train": [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 17, 19, 20, 23, 24, 25, 26, 27, 29, 30, 33, 34, 38, 39, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 57, 58, 60, 61, 62, 64, 66, 67, 68, 70, 71, 72, 74, 75, 76, 79],
        "validation": [16, 35, 36, 40, 56, 59, 63, 65, 69, 73, 77, 78]
      },
  ]

  public static testSplit: number[] = [9, 12, 18, 21, 22, 28, 31, 32, 37];
  // public static testSplit = [1,4];
  // public static testSplit: number[] = [];
  // public static splits: Record<string, number[]>[] = [
  //   {
  //     "train": [2, 3, 5, 7],
  //     "validation": [0, 6]
  //   }
  // ];



  // public static testSplit = [6,7];
  // public static splits: Record<string, number[]>[] = [
  //   {
  //     "train": [0, 1, 2, 3],
  //     "validation": [4, 5]
  //   }
  // ];


}
