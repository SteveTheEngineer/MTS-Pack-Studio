import { SelectionModel } from "@angular/cdk/collections";
import { FlatTreeControl, NestedTreeControl } from "@angular/cdk/tree";
import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { ProjectService, Node } from '../project.service';
import { ViewportService } from "./viewport/viewport.service";

@Component({
  selector: "app-project",
  templateUrl: "./project.component.html",
  styleUrls: ["./project.component.scss"]
})
export class ProjectComponent {

  showEditor(): boolean {
    return this.projectService.currentNode !== undefined;
  }

  getCurrentNode(): Node | undefined {
    return this.projectService.currentNode;
  }

  constructor(private viewportService: ViewportService, private projectService: ProjectService) {}
}
