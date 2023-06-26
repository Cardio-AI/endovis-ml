import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import {SurgeryData} from "../model/SurgeryData";
import {PhaseAnnotationRow} from "../model/PhaseAnnotationRow";
import {CONSTANTS} from "../constants";
import {Occurrence} from "../model/Occurrence";
import {DataCounterNew} from "../model/DataCounterNew";
import {SetMethods} from "../util/SetMethods";
import {NestedOccurrence} from "../model/NestedOccurrence";
import {UserFileUpload} from "../model/UserFileUpload";


@Injectable({
  providedIn: 'root'
})
export class DataParserService {

  constructor() { }

  parseData(phaseData: UserFileUpload<string>[], instData: UserFileUpload<string>[]): SurgeryData[] {
    return phaseData.map((e) => {

      const fileName = e.name.match(new RegExp(`(.+)${CONSTANTS.phaseFileSuffix}`))![1];
      const fileNumber = parseInt(e.name.match(/\d+/)![0]);

      let parsedPhases = d3.csvParse(e.content, row => {
        return {
          frame: +row[CONSTANTS.columnNames.frame]!,
          phase: +row[CONSTANTS.columnNames.phase]!
        }
      });

      const duration = parsedPhases.length;

      const instFile = instData.find(e => e.name === `${fileName}${CONSTANTS.instFileSuffix}`);

      let parsedInst: Record<string, number>[] = d3.csvParse(instFile!.content, row => {
        let result: Record<string, number> = {};
        Object.keys(row).forEach((key: string) => {
          result[key] = +row[key]!;
        })
        return result;
      });

      // let parsedPredictions = d3.csvParse(predData[i], row => {
      //   return {
      //     frame: +row['frame']!,
      //     phase: +row['phase']!
      //   }
      // });
      //
      // const labels = tf.tensor1d(parsedPhases.map(e => e['phase']), 'int32');
      // const predictions = tf.tensor1d(parsedPredictions.map(e => e['phase']), 'int32');
      // const numClasses = 7;
      // const out = tf.math.confusionMatrix(labels, predictions, numClasses);
      //
      // console.log(out.arraySync())

      const currSet = CONSTANTS.datasets.filter(d => d !== 'test')
        .find(set => CONSTANTS.splits[0][set].includes(fileNumber)) || (CONSTANTS.testSplit.includes(fileNumber) ? 'test' : 'unassigned');

      const phaseIndex = this.createPhaseIndex(parsedPhases);
      const phaseIndex2 = this.createPhaseIndex2(parsedPhases);

      const instIndex = this.createInstIndex(parsedInst, parsedPhases[parsedPhases.length - 1].frame);
      const idleId = CONSTANTS.instrumentMappingInverse(CONSTANTS.idleLabel)!;
      const idleIndex = this.createIdleIndex(parsedInst, parsedPhases[parsedPhases.length - 1].frame);
      instIndex[idleId] = idleIndex;

      const occIndex = this.createInstCooccurrenceIndex(parsedInst, parsedPhases[parsedPhases.length - 1].frame);
      occIndex.push({object: new Set([idleId]), value: idleIndex})
      // console.log(duration)
      // console.log(d3.sum(occIndex.map(e => d3.sum(e.value.map(u => u.end - u.start + 1)))))
      // console.log(d3.sum(this.createIdleIndex(parsedInst, duration).map(e => e.end - e.start + 1)))
      // console.log(duration - (d3.sum(occIndex.map(e => d3.sum(e.value.map(u => u.end - u.start + 1)))) + d3.sum(this.createIdleIndex(parsedInst, duration).map(e => e.end - e.start + 1))))
      // console.log('##')

      // this.mergePhaseIndexToInstIndex(phaseIndex2, occIndex);
      // this.mergeInstIndexToPhaseIndex(phaseIndex2, occIndex);

      return {
        spNr: fileNumber,
        spName: fileName,
        phaseData: parsedPhases,
        instData: parsedInst,
        phaseIndex: phaseIndex,
        phaseIndex2: phaseIndex2,
        instIndex: instIndex,
        occIndex: occIndex,
        set: currSet,
        // set: CONSTANTS.datasets[Math.floor(Math.random() * CONSTANTS.datasets.length)],
        duration: duration,
      };
    });
  }

  private createPhaseIndex(phaseAnnot: PhaseAnnotationRow[]): Record<string, Occurrence[]> {

    let result: Record<string, Occurrence[]> = {};

    CONSTANTS.phaseMapping.domain().forEach((phaseId: string) => result[phaseId] = [])

    let startFrame = -1;

    let currFrame = -1;
    let currPhase = -1;

    phaseAnnot.forEach(phaseAnnotRow => { // for each frame
      if (phaseAnnotRow.frame === 0) { // first frame
        startFrame = phaseAnnotRow.frame;
        currPhase = phaseAnnotRow.phase;
      }

      if (phaseAnnotRow.phase !== currPhase) { // phase changed
        result[currPhase].push({start: startFrame, end: currFrame})
        startFrame = phaseAnnotRow.frame;
        currPhase = phaseAnnotRow.phase;
      }

      currFrame = phaseAnnotRow.frame;
    })

    // flush remaining data
    if (startFrame !== null) {
      result[currPhase].push({start: startFrame, end: currFrame});
    }

    return result;
  }

  private createPhaseIndex2(phaseAnnot: PhaseAnnotationRow[]): DataCounterNew<string, NestedOccurrence<Set<string>>[]>[] {

    let result: DataCounterNew<string, NestedOccurrence<Set<string>>[]>[] = CONSTANTS.phaseMapping.domain().map((phaseId: string) => ({object: phaseId, value: []}))

    let startFrame = -1;

    let currFrame = -1;
    let currPhase = -1;

    phaseAnnot.forEach(phaseAnnotRow => { // for each frame
      if (phaseAnnotRow.frame === 0) { // first frame
        startFrame = phaseAnnotRow.frame;
        currPhase = phaseAnnotRow.phase;
      }

      if (phaseAnnotRow.phase !== currPhase) { // phase changed
        result.find(e => e.object === currPhase + "")!.value.push({start: startFrame, end: currFrame, nestedOccurrences: []})

        startFrame = phaseAnnotRow.frame;
        currPhase = phaseAnnotRow.phase;
      }

      currFrame = phaseAnnotRow.frame;
    })

    // flush remaining data
    if (startFrame !== null) {
      result.find(e => e.object === currPhase + "")!.value.push({start: startFrame, end: currFrame, nestedOccurrences: []})
    }

    return result;
  }

  // dynamic definition of the result object
  private createInstIndex(instAnnot: Record<string, number>[], lastFrameNr: number): Record<string, Occurrence[]> { // constructs occurrence data object
    // initialize result object
    let result: Record<string, Occurrence[]> = {}

    CONSTANTS.instrumentMapping.range().forEach(inst => { // for each instrument
      if (inst !== CONSTANTS.idleLabel) {
        const instId = CONSTANTS.instrumentMappingInverse(inst)!;
        result[instId] = []

        let startFrame = -1;
        let currFrame = -1;
        let prevFrame = -1;
        instAnnot.forEach(row => { // for each row
          currFrame = row[CONSTANTS.columnNames.frame];

          if (startFrame === -1 && row[inst] === 1) { // first frame
            startFrame = currFrame;
          } else if (startFrame !== -1) {
            if (currFrame - prevFrame > CONSTANTS.instFrameStep) { // this check is only necessary because of heico data
              result[instId].push({start: startFrame, end: Math.min(prevFrame + CONSTANTS.instFrameStep - 1, lastFrameNr)});
              startFrame = -1;
            } else if(row[inst] === 0) { // last frame
              result[instId].push({start: startFrame, end: currFrame - 1});
              startFrame = -1;
            }
          }
          prevFrame = currFrame;
        });

        // flush remaining data
        if (startFrame !== -1) {
          result[instId].push({start: startFrame, end: lastFrameNr});
          startFrame = -1;
        }
      }
    });

    return result;
  }

  private createIdleIndex(instAnnot: Record<string, number>[], lastFrameNr: number): NestedOccurrence<string>[] {
    let result: NestedOccurrence<string>[] = [];

    let startFrame = -1;
    let currFrame = -1;
    let prevFrame = 0 - CONSTANTS.instFrameStep; // offset to detect annotations that don't start with 0

    instAnnot.forEach(row => {
      currFrame = row[CONSTANTS.columnNames.frame];
      const currRowNotNull = CONSTANTS.instrumentMapping.range().filter(e => e !== CONSTANTS.columnNames.frame).filter(u => row[u] > 0);

      if(startFrame === -1 && currFrame - prevFrame > CONSTANTS.instFrameStep) { // this check is only necessary because of heico data
        startFrame = Math.min(prevFrame + CONSTANTS.instFrameStep, lastFrameNr);
      }

      if (startFrame === -1 && currRowNotNull.length === 0) { // idle section
        startFrame = currFrame;
      } else if (startFrame !== -1 && currRowNotNull.length > 0) { // instrument now present

        result.push({start: startFrame, end: currFrame - 1, nestedOccurrences: []});
        startFrame = -1;
      }
      prevFrame = currFrame;
    });

    // flush remaining data
    if (startFrame !== -1) {
      result.push({start: startFrame, end: lastFrameNr, nestedOccurrences: []});
      startFrame = -1;
    }

    return result;
  }

  private createInstCooccurrenceIndex(instAnnot: Record<string, number>[], lastFrameNr: number): DataCounterNew<Set<string>,  NestedOccurrence<string>[]>[] {
    let result: DataCounterNew<Set<string>, NestedOccurrence<string>[]>[] = [];

    instAnnot.forEach(frame => { // for each frame
      let occurrenceSet = new Set<string>();

      CONSTANTS.instrumentMapping.range().forEach(inst => { // for each instrument
        let instId = CONSTANTS.instrumentMappingInverse(inst);
        let instValue = frame[inst];
        if (instValue === 1) { // instrument present
          occurrenceSet.add(instId);
        }
      });

      if (occurrenceSet.size > 0) { // single instruments are also counted
        let resultEntry = result.find(e => SetMethods.setEquality(e.object, occurrenceSet));
        let currOcc = {start: frame[CONSTANTS.columnNames.frame], end: Math.min(frame[CONSTANTS.columnNames.frame] + CONSTANTS.instFrameStep - 1, lastFrameNr), nestedOccurrences: []};

        if (resultEntry !== undefined) { // occurrence already present in the result object

          let prevOcc = resultEntry.value.find(e => e.end + 1 === currOcc.start);

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
    });

    return result;
  }

  /**
   * In-place modification of phaseIndex object
   * @param phaseIndex
   * @param instIndex
   * @private
   */
  private mergePhaseIndexToInstIndex(phaseIndex: DataCounterNew<string, NestedOccurrence<Set<string>>[]>[], instIndex: DataCounterNew<Set<string>, NestedOccurrence<string>[]>[]) {
    phaseIndex.forEach(phase => {
      phase.value.forEach(phaseOcc => {
        instIndex.forEach(inst => {
          inst.value.forEach(instOcc => {
            let overlapStart = Math.max(phaseOcc.start, instOcc.start);
            let overlapEnd = Math.min(phaseOcc.end, instOcc.end);

            if(overlapStart < overlapEnd) {
              let entry = phaseOcc.nestedOccurrences.find(e => SetMethods.setEquality(e.object, inst.object));

              if(entry !== undefined) {
                entry.value.push({start: overlapStart, end: overlapEnd});
              } else {
                phaseOcc.nestedOccurrences.push({object: inst.object, value: [{start: overlapStart, end: overlapEnd}]});
              }
            }
          });
        });
      });
    });
  }

  private mergeInstIndexToPhaseIndex(phaseIndex: DataCounterNew<string, NestedOccurrence<Set<string>>[]>[], instIndex: DataCounterNew<Set<string>, NestedOccurrence<string>[]>[]) {
    instIndex.forEach(inst => {
      inst.value.forEach(instOcc => {
        phaseIndex.forEach(phase => {
          phase.value.forEach(phaseOcc => {

            let overlapStart = Math.max(phaseOcc.start, instOcc.start);
            let overlapEnd = Math.min(phaseOcc.end, instOcc.end);

            if (overlapStart < overlapEnd) {
              let entry = instOcc.nestedOccurrences.find(e => e.object === phase.object);

              if (entry !== undefined) {
                entry.value.push({start: overlapStart, end: overlapEnd});
              } else {
                instOcc.nestedOccurrences.push({object: phase.object, value: [{start: overlapStart, end: overlapEnd}]});
              }
            }
          });
        });
      });
    });
  }

}
