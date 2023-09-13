import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelEvalComponent } from './model-eval.component';

describe('ModelEvalComponent', () => {
  let component: ModelEvalComponent;
  let fixture: ComponentFixture<ModelEvalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelEvalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelEvalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
