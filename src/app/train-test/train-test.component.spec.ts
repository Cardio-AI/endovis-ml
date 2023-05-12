import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainTestComponent } from './train-test.component';

describe('TrainTestComponent', () => {
  let component: TrainTestComponent;
  let fixture: ComponentFixture<TrainTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrainTestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
