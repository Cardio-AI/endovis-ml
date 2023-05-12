import { TestBed } from '@angular/core/testing';

import { DataForwardService } from './data-forward.service';

describe('DataForwardService', () => {
  let service: DataForwardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataForwardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
