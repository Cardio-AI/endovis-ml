import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TrainTestComponent} from "./train-test/train-test.component";
import {LandingComponent} from "./landing/landing.component";
import {UploadComponent} from "./upload/upload.component";

const routes: Routes = [
  { path: '', component: LandingComponent},
  { path: 'upload', component: UploadComponent},
  { path: 'train-test', component: TrainTestComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
