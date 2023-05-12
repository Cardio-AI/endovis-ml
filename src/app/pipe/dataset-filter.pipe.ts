import { Pipe, PipeTransform } from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";

@Pipe({
  name: 'datasetFilter'
})
export class DatasetFilterPipe implements PipeTransform {

  transform(list: SurgeryData[] | null, datasetName: string): SurgeryData[] | null {
    if(list) {
      return list.filter(e => e.set === datasetName);
    }
    return null;
  }

}
