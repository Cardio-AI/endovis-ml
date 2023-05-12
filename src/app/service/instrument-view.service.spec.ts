import { TestBed } from '@angular/core/testing';

import { InstrumentViewService } from './instrument-view.service';

describe('InstrumentViewService', () => {
  let service: InstrumentViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstrumentViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
