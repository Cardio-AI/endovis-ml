import { TestBed } from '@angular/core/testing';

import { InstrumentSelectionService } from './instrument-selection.service';

describe('InstrumentSelectionService', () => {
  let service: InstrumentSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstrumentSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
