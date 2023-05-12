import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemporalViewComponent } from './temporal-view.component';

describe('TemporalViewComponent', () => {
  let component: TemporalViewComponent;
  let fixture: ComponentFixture<TemporalViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemporalViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemporalViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
