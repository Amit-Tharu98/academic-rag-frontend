import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchDashboard } from './research-dashboard';

describe('ResearchDashboard', () => {
  let component: ResearchDashboard;
  let fixture: ComponentFixture<ResearchDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResearchDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResearchDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
