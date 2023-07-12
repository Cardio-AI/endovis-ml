import {TestBed} from '@angular/core/testing';

import {MainViewGuard} from './main-view.guard';

describe('MainViewGuard', () => {
  let guard: MainViewGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(MainViewGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
