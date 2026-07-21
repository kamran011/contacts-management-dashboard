import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
  });

  it('renders an <img> when a src is provided', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', 'https://example.com/avatar.png');
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png');
  });

  it('falls back to initials when no src is provided', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', null);
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.avatar__initials');
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();
    expect(initials?.textContent?.trim()).toBe('AL');
  });

  it('falls back to initials when the image fails to load', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', 'https://example.com/broken.png');
    fixture.componentRef.setInput('name', 'Grace Hopper');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.avatar__initials')?.textContent?.trim()).toBe('GH');
  });
});
