import { TestBed } from '@angular/core/testing';

import { PhaseSelectionService } from './phase-selection.service';

describe('PhaseSelectionService', () => {
  let service: PhaseSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhaseSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
