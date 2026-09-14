import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareModels } from './compare-models';

describe('CompareModels', () => {
  let component: CompareModels;
  let fixture: ComponentFixture<CompareModels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareModels]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompareModels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
