import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaseFreqComponent } from './phase-freq.component';

describe('PhaseFreqComponent', () => {
  let component: PhaseFreqComponent;
  let fixture: ComponentFixture<PhaseFreqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhaseFreqComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhaseFreqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
