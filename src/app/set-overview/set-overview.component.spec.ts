import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetOverviewComponent } from './set-overview.component';

describe('SetOverviewComponent', () => {
  let component: SetOverviewComponent;
  let fixture: ComponentFixture<SetOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
