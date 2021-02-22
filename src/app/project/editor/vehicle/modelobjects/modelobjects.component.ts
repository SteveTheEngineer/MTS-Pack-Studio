import { Component, OnInit } from '@angular/core';
import { ModelObject, ProjectService, VehicleNode } from 'src/app/project.service';
import { ViewportService } from 'src/app/project/viewport/viewport.service';

@Component({
  selector: 'vehicle-modelobjects',
  templateUrl: './modelobjects.component.html',
  styleUrls: ['./modelobjects.component.scss']
})
export class ModelObjectsComponent implements OnInit {

  constructor(private projectService: ProjectService, private viewport: ViewportService) { }

  getCurrentNode(): VehicleNode {
    return this.projectService.currentNode as VehicleNode;
  }

  isGhost(object: ModelObject): boolean {
    return !Object.keys(this.viewport.modelMeshMap).includes(object.name);
  }

  ngOnInit(): void {
  }

  getModelObjects(): ModelObject[] {
    return this.getCurrentNode().modelObjects;
  }

  getAvailableDependencies(object: ModelObject): ModelObject[] {
    return this.getModelObjects().filter(modelObject => modelObject !== object && !this.dependsOnRecursive(modelObject, object));
  }

  dependsOnRecursive(dependant: ModelObject, dependency: ModelObject): boolean {
    if(dependant.applyAfter === "") {
      return false;
    }
    if(dependant.applyAfter === dependency.name) {
      return true;
    }
    const dependantDependency: ModelObject | undefined = this.getModelObjects().find(object => object.name === dependant.applyAfter);
    if(dependantDependency !== undefined) {
      return this.dependsOnRecursive(dependantDependency, dependency);
    } else {
      return false;
    }
  }
}
