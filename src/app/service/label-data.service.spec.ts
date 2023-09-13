import {TestBed} from '@angular/core/testing';

import {LabelDataService} from './label-data.service';

describe('LabelDataService', () => {
  let service: LabelDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LabelDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
