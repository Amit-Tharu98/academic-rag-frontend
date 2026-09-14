import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadAnalyse } from './upload-analyse';

describe('UploadAnalyse', () => {
  let component: UploadAnalyse;
  let fixture: ComponentFixture<UploadAnalyse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadAnalyse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadAnalyse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
