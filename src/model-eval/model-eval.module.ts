import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricOverviewComponent } from './metric-overview/metric-overview.component';
import { ModelEvalComponent } from './model-eval/model-eval.component';



@NgModule({
  declarations: [
    MetricOverviewComponent,
    ModelEvalComponent
  ],
  imports: [
    CommonModule
  ]
})
export class ModelEvalModule { }
