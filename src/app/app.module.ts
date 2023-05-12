import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TrainTestComponent } from './train-test/train-test.component';
import { HttpClientModule } from "@angular/common/http";
import { OverviewComponent } from './overview/overview.component';
import { SetAssignmentComponent } from './set-assignment/set-assignment.component';
import { PhaseFreqComponent } from './phase-freq/phase-freq.component';
import { DatasetFilterPipe } from './pipe/dataset-filter.pipe';
import { SetOverviewComponent } from './set-overview/set-overview.component';
import { ClassFreqComponent } from './class-freq/class-freq.component';
import { TemporalViewComponent } from './temporal-view/temporal-view.component';
import { PhaseParamComponent } from './phase-param/phase-param.component';
import {ModelEvalModule} from "../model-eval/model-eval.module";
import { GraphViewComponent } from './graph-view/graph-view.component';
import { InstCoocurrenceComponent } from './inst-coocurrence/inst-coocurrence.component';

@NgModule({
  declarations: [
    AppComponent,
    TrainTestComponent,
    OverviewComponent,
    SetAssignmentComponent,
    PhaseFreqComponent,
    DatasetFilterPipe,
    SetOverviewComponent,
    ClassFreqComponent,
    TemporalViewComponent,
    PhaseParamComponent,
    GraphViewComponent,
    InstCoocurrenceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ModelEvalModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
