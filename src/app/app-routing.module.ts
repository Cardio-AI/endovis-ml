import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TrainTestComponent} from "./train-test/train-test.component";
import {LandingComponent} from "./landing/landing.component";
import {UploadComponent} from "./upload/upload.component";
import {MainViewGuard} from "./guards/main-view.guard";

const routes: Routes = [
  { path: 'upload', component: UploadComponent},
  { path: 'train-test', component: TrainTestComponent, canActivate: [MainViewGuard]},
  { path: '', component: LandingComponent},
  { path: '**', component: LandingComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
