import { TestBed } from '@angular/core/testing';

import { DataParserService } from './data-parser.service';

describe('DataParserService', () => {
  let service: DataParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
