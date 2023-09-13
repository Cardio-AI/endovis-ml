import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TrainTestComponent} from "./train-test/train-test.component";

const routes: Routes = [
  { path: '', component: TrainTestComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
