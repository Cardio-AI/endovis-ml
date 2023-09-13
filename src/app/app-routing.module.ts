import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TrainTestComponent} from "./train-test/train-test.component";
import {ModelEvalComponent} from "../model-eval/model-eval/model-eval.component";

const routes: Routes = [
  { path: '', component: TrainTestComponent},
  // { path: 'train-test', component: TrainTestComponent},
  // { path: 'model-eval', component: ModelEvalComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
