import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelObjectsComponent } from './modelobjects.component';

describe('ModelobjectsComponent', () => {
  let component: ModelObjectsComponent;
  let fixture: ComponentFixture<ModelObjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModelObjectsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
