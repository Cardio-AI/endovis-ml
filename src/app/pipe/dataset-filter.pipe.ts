import {Pipe, PipeTransform} from '@angular/core';
import {SurgeryData} from "../model/SurgeryData";

@Pipe({
  name: 'datasetFilter'
})
export class DatasetFilterPipe implements PipeTransform {

  transform(list: SurgeryData[], datasetName: string | undefined): SurgeryData[] {
    return list.filter(e => e.set === datasetName);
  }

}
