import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TrainTestComponent} from './train-test/train-test.component';
import {HttpClientModule} from "@angular/common/http";
import {SetAssignmentComponent} from './set-assignment/set-assignment.component';
import {DatasetFilterPipe} from './pipe/dataset-filter.pipe';
import {SetOverviewComponent} from './set-overview/set-overview.component';
import {GraphViewComponent} from './graph-view/graph-view.component';
import {InstCoocurrenceComponent} from './inst-coocurrence/inst-coocurrence.component';

@NgModule({
  declarations: [
    AppComponent,
    TrainTestComponent,
    SetAssignmentComponent,
    DatasetFilterPipe,
    SetOverviewComponent,
    GraphViewComponent,
    InstCoocurrenceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
