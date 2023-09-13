import {SurgeryData} from "../../app/model/SurgeryData";
import * as d3 from "d3";

export class metrics {

  // public static confusionMatrix(surgeryData: SurgeryData[], labels: string[]) {
  //   let matrix = new Map(labels.map(e => [e,0]));
  //   labels.forEach(label => { // for each class
  //     let row = new Map(labels.map(e => [e,0]));
  //
  //     surgeryData.forEach(sp => { // for each surgery
  //       let nrFrames = 0;
  //       let phaseData = sp.phaseIndex[label];
  //       if (phaseData !== undefined) {
  //         phaseData.forEach(occ => { // for each occurrence
  //           let predData = sp.predData?.filter(frame => frame.frame >= occ.start && frame.frame <= occ.end);
  //           if (predData !== undefined) {
  //             predData.forEach(() => {
  //               nrFrames++;
  //               row.set(label, (row.get(label) ?? 0) + 1)
  //             });
  //           }
  //         });
  //       }
  //       let spNrFrames = d3.sum(row.values());
  //       row.forEach((value, key) => {
  //         row.set(key, (row.get(key) ?? 0) / spNrFrames)
  //       });
  //
  //       matrix.set(label, (row.get(label) ?? 0))
  //
  //     });
  //   });
  // }
}
