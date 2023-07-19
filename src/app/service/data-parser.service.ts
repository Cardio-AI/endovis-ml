import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {SurgeryData} from "../model/SurgeryData";
import {PhaseAnnotationRow} from "../model/PhaseAnnotationRow";
import {CONSTANTS} from "../constants";
import {Occurrence} from "../model/Occurrence";
import {DataCounterNew} from "../model/DataCounterNew";
import {SetMethods} from "../util/SetMethods";
import {FileUpload} from "../model/FileUpload";
import {ParamFile} from "../model/ParamFile";
import {Delimiter} from "../enums/Delimiter";
import {Split} from "../enums/Split";
import {InstAnnotationRow} from "../model/InstAnnotationRow";
import {AnnotationRow} from "../model/AnnotationRow";


@Injectable({
  providedIn: 'root'
})
export class DataParserService {

  constructor() {
  }

  parseParamFile(file: FileUpload<string>) {
    return JSON.parse(file.content) as ParamFile;
  }

  splitString(str: string): string[] {
    const arr = str.split(",").map(e => e.trim());

    if(arr.length == 0) {
      throw new Error("The provided string is empty");
    }

    return arr;
  }

  matchPhaseAndInstFiles(fileList: FileUpload<string>[], phaseId: string, instId: string) {
    let matches: [FileUpload<string>, FileUpload<string>][] = [];
    const regex: RegExp = /0*\d+/;

    const phaseFiles = fileList.filter(file => file.name.includes(phaseId));
    const instFiles = fileList.filter(file => file.name.includes(instId));
    const otherFiles = fileList.filter(file => !file.name.includes(phaseId) && !file.name.includes(instId) && file.name !== 'param.json');

    if (phaseFiles.length == 0) {
      throw new Error('Could not find phase annotation files');
    }

    if (instFiles.length == 0) {
      throw new Error('Could not find instrument annotation files');
    }

    if (otherFiles.length > 0) {
      console.log("Could not recognize the following file names:")
      console.log(otherFiles)
    }

    if (phaseFiles.length != instFiles.length) {
      console.log(`The number of phase (${phaseFiles.length}) and instrument (${instFiles.length}) annotation files does not match`)
    }

    phaseFiles.forEach(phaseFile => {
      const surgeryId = phaseFile.name.match(regex)![0];

      const instFile = instFiles.filter(instFile => instFile.name.includes(surgeryId))

      if (instFile.length == 1) {
        matches.push([phaseFile, instFile[0]])
      } else {
        throw new Error(`Could not find matching instrument annotation file for ${phaseFile.name}`)
      }
    });

    return matches;
  }

  parseData(phaseFile: FileUpload<string>, instFile: FileUpload<string>, phaseId: string, delimiter: Delimiter, instLabels:string[], trainingSet: Set<number>, validationSet: Set<number>, testSet:Set<number>): SurgeryData {
    const surgeryName: string = this.filenameToSurgeryName(phaseFile.name, phaseId);
    const fileNumber: number = this.surgeryNameToSurgeryId(surgeryName);

    const delimiterValue = this.convertDelimiter(delimiter);

    // parse phase annotations
    const parsedPhases: PhaseAnnotationRow[] = d3.dsvFormat(delimiterValue)
      .parse(phaseFile.content, (row: d3.DSVRowString<keyof PhaseAnnotationRow>, i: number): PhaseAnnotationRow => {
        if (!row.Frame || !row.Phase || isNaN(parseInt(row.Frame)) || isNaN(parseInt(row.Phase))) {
          throw new Error(`Invalid value in file ${phaseFile.name} at line ${i}`)
        }

        return {
          Frame: parseInt(row.Frame),
          Phase: parseInt(row.Phase),
        }
      });

    const duration = parsedPhases.length;

    // parse instrument annotations
    const parsedInst = d3.dsvFormat(delimiterValue)
      .parse(instFile.content, (row: d3.DSVRowString<"Frame" | string>, i: number) => {
        let frame = row['Frame'];

        if (!frame || isNaN(parseInt(frame))) {
          throw new Error(`Invalid value in file ${phaseFile.name} at line ${i}`)
        }

        let result: InstAnnotationRow = {Frame: parseInt(frame)};

        instLabels.forEach((key: string) => {
          let value = row[key];

          if (!value || isNaN(parseInt(value))) {
            throw new Error(`Invalid value in file ${phaseFile.name} at line ${i}`)
          }

          result[key] = parseInt(value);
        });

        return result;
      });

    // initial assignment to sets
    const currSet = trainingSet.has(fileNumber) ?
      Split.Training : validationSet.has(fileNumber) ?
        Split.Validation :  testSet.has(fileNumber) ? Split.Test : undefined;

    const phaseIndex = this.createPhaseIndex(parsedPhases);

    const instIndex = this.createInstIndex(parsedInst);
    const idleId = CONSTANTS.instrumentMappingInverse(CONSTANTS.idleLabel)!;
    const idleIndex = this.createIdleIndex(parsedInst);
    instIndex[idleId] = idleIndex;

    const occIndex = this.createInstOccurrenceIndex(parsedInst, parsedPhases[parsedPhases.length - 1].Frame);
    occIndex.push({object: new Set([idleId]), value: idleIndex})

    return {
      spNr: fileNumber,
      spName: surgeryName,
      // phaseData: parsedPhases,
      // instData: parsedInst,
      parsedData: this.unifyFiles(parsedPhases, parsedInst, instLabels),
      phaseIndex: phaseIndex,
      instIndex: instIndex,
      occIndex: occIndex,
      set: currSet,
      // set: CONSTANTS.datasets[Math.floor(Math.random() * CONSTANTS.datasets.length)],
      duration: duration,
    };
  }

  private createPhaseIndex(phaseAnnot: PhaseAnnotationRow[]): Record<string, Occurrence[]> {

    let result: Record<string, Occurrence[]> = {};

    CONSTANTS.phaseMapping.domain().forEach((phaseId: string) => result[phaseId] = [])

    let startFrame = -1;
    let currPhase = -1;
    let prevFrame = -1;

    phaseAnnot.forEach(phaseAnnotRow => { // for each frame
      if (phaseAnnotRow.Frame === 0) { // first frame
        startFrame = phaseAnnotRow.Frame;
        currPhase = phaseAnnotRow.Phase;
      } else if (phaseAnnotRow.Phase !== currPhase) { // phase changed
        result[currPhase].push({start: startFrame, end: prevFrame})
        startFrame = phaseAnnotRow.Frame;
        currPhase = phaseAnnotRow.Phase;
      }
      prevFrame = phaseAnnotRow.Frame;
    })

    // flush remaining data
    if (startFrame !== null) {
      result[currPhase].push({start: startFrame, end: prevFrame});
    }

    return result;
  }


  // dynamic definition of the result object
  private createInstIndex(instAnnot: Record<string, number>[]): Record<string, Occurrence[]> { // constructs occurrence data object
    // initialize result object
    let result: Record<string, Occurrence[]> = {}

    CONSTANTS.instrumentMapping.range().forEach(inst => { // for each instrument
      if (inst !== CONSTANTS.idleLabel) {
        const instId = CONSTANTS.instrumentMappingInverse(inst)!;

        // initialize empty array
        result[instId] = []

        let startFrame = -1;
        let currFrame = -1;
        let prevFrame = -1;

        instAnnot.forEach(row => { // for each row
          currFrame = row[CONSTANTS.columnNames.frame];

          if (startFrame === -1 && row[inst] === 1) { // first frame
            startFrame = currFrame;
          } else if (startFrame !== -1 && row[inst] === 0) { // last frame
            result[instId].push({start: startFrame, end: prevFrame});
            startFrame = -1;
          }
          prevFrame = currFrame;
        });

        // flush remaining data
        if (startFrame !== -1) {
          result[instId].push({start: startFrame, end: prevFrame});
        }
      }
    });
    return result;
  }

  private createIdleIndex(instAnnot: Record<string, number>[]): Occurrence[] {
    let result: Occurrence[] = [];

    let startFrame = -1;
    let currFrame = -1;
    let prevFrame = -1;

    instAnnot.forEach(row => { // for each row
      currFrame = row[CONSTANTS.columnNames.frame];
      const currRowSum = CONSTANTS.instrumentMapping.range()
        .filter(r => r !== CONSTANTS.idleLabel)
        .reduce((p, c) => p + row[c], 0);

      if (startFrame === -1 && currRowSum === 0) { // first frame
        startFrame = currFrame;
      } else if (startFrame !== -1 && currRowSum > 0) { // instrument now present
        result.push({start: startFrame, end: prevFrame});
        startFrame = -1;
      }
      prevFrame = currFrame;
    });

    // flush remaining data
    if (startFrame !== -1) {
      result.push({start: startFrame, end: prevFrame}); // TODO: is lastFrameNr necessary?
    }

    return result;
  }

  private createInstOccurrenceIndex(instAnnot: Record<string, number>[], lastFrameNr: number): DataCounterNew<Set<string>, Occurrence[]>[] {
    let result: DataCounterNew<Set<string>, Occurrence[]>[] = [];
    let prevFrame = -1;

    instAnnot.forEach(frame => { // for each frame
      let occurrenceSet = new Set<string>();
      let currFrame = frame[CONSTANTS.columnNames.frame];

      CONSTANTS.instrumentMapping.range().forEach(inst => { // for each instrument
        let instId = CONSTANTS.instrumentMappingInverse(inst);
        let instValue = frame[inst];
        if (instValue === 1) { // instrument present
          occurrenceSet.add(instId);
        }
      });

      if (occurrenceSet.size > 0) { // single instruments are also counted
        let resultEntry = result.find(e => SetMethods.setEquality(e.object, occurrenceSet));
        let currOcc = {
          start: currFrame,
          end: Math.min(frame[CONSTANTS.columnNames.frame], lastFrameNr) // TODO: is lastFrameNr necessary?
        };

        if (resultEntry !== undefined) { // occurrence already present in the result object

          let prevOcc = resultEntry.value.find(e => e.end === prevFrame);

          if (prevOcc !== undefined) { // subsequent occurrence
            prevOcc.end = currOcc.end; // extend previous occurrence object
          } else { // non-subsequent co-occurrence
            resultEntry.value.push(currOcc)
          }
        } else { // first occurrence
          result.push({
            object: occurrenceSet,
            value: [currOcc]
          });
        }
      }
      prevFrame = currFrame;
    });

    return result;
  }

  private unifyFiles(phaseData: PhaseAnnotationRow[], instData: InstAnnotationRow[], instLabels: string[]) {
    let result: AnnotationRow[]= [];

    phaseData.forEach(phaseRow => { // for each row
      let unifiedRow: AnnotationRow = {Frame: phaseRow.Frame, Phase: phaseRow.Phase};

      let instRow = instData.find(instRow => instRow.Frame === phaseRow.Frame);

      if (instRow) {
        for (let label of instLabels) {
          unifiedRow[label] = instRow[label];
        }
        result.push(unifiedRow);
      } else {
        console.log(`Skipping unannotated row`)
      }
    });
    return result;
  }

  private filenameToSurgeryName(filename: string, discard: string) {
    let surgeryName = filename.split(".")[0].replace(discard, "");
    const regex = /[a-zA-Z0-9]/

    if(!surgeryName.charAt(0).match(regex)) {
      surgeryName = surgeryName.slice(1);
    }

    if(!surgeryName.charAt(surgeryName.length - 1).match(regex)) {
      surgeryName = surgeryName.slice(0, surgeryName.length - 1);
    }

    if(surgeryName.length > 0) {
      return surgeryName
    } else {
      throw new Error('Could not infer surgery name from a given filename')
    }
  }

  private surgeryNameToSurgeryId(surgeryName: string) {
    const surgeryIdRegex = surgeryName.match(/\d+/);

    if(surgeryIdRegex) {
      return parseInt(surgeryIdRegex[0]);
    } else {
      throw new Error("Could not infer surgery ID from the given surgery name");
    }
  }

  private convertDelimiter(delimiter: Delimiter) {
    switch (delimiter) {
      case Delimiter.COMMA:
        return ",";
      case Delimiter.TAB:
        return "\t";
      case Delimiter.SEMICOLON:
        return ";";
    }
  }
}
