import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstCoocurrenceComponent } from './inst-coocurrence.component';

describe('InstCoocurrenceComponent', () => {
  let component: InstCoocurrenceComponent;
  let fixture: ComponentFixture<InstCoocurrenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstCoocurrenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstCoocurrenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
