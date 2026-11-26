import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EmployeeDashboard } from './dashboard';

describe('EmployeeDashboard', () => {
  let component: EmployeeDashboard;
  let fixture: ComponentFixture<EmployeeDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create employee dashboard', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize shift metrics and recent transactions', () => {
    expect(component.shiftStats().shiftTotal).toBeGreaterThan(0);
    expect(component.recentTransactions().length).toBeGreaterThan(0);
  });
});
