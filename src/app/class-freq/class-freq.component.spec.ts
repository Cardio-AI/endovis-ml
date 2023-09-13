import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassFreqComponent } from './class-freq.component';

describe('ClassFreqComponent', () => {
  let component: ClassFreqComponent;
  let fixture: ComponentFixture<ClassFreqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassFreqComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassFreqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
