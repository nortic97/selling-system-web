import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the home component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle authentication modal state', () => {
    expect(component.isAuthModalOpen()).toBe(false);
    component.openAuthModal();
    expect(component.isAuthModalOpen()).toBe(true);
    component.closeAuthModal();
    expect(component.isAuthModalOpen()).toBe(false);
  });

  it('should close modal on escape key event', () => {
    component.openAuthModal();
    expect(component.isAuthModalOpen()).toBe(true);
    component.onEscapePress();
    expect(component.isAuthModalOpen()).toBe(false);
  });
});
