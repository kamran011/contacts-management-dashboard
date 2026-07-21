import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
  });

  it.each([
    ['online', 'status-dot--online'],
    ['away', 'status-dot--away'],
    ['offline', 'status-dot--offline'],
  ] as const)('renders the %s dot with class %s', (status, expectedClass) => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();

    const dot = fixture.nativeElement.querySelector('.status-dot');
    expect(dot.classList.contains(expectedClass)).toBe(true);
  });
});
