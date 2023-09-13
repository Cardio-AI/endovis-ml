import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaseParamComponent } from './phase-param.component';

describe('PhaseParamComponent', () => {
  let component: PhaseParamComponent;
  let fixture: ComponentFixture<PhaseParamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhaseParamComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhaseParamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
