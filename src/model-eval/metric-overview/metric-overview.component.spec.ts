import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricOverviewComponent } from './metric-overview.component';

describe('MetricOverviewComponent', () => {
  let component: MetricOverviewComponent;
  let fixture: ComponentFixture<MetricOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MetricOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetricOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
