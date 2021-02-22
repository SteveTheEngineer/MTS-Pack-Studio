import { SelectionChange } from '@angular/cdk/collections';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { interval, Subscription } from 'rxjs';
import { Ingredient, IngredientSet, ModelObject, Node, NodeAsset, NodeAssetType, ProjectService, Vector2, VehicleDefinition, VehicleInstrument, VehicleNode, VehiclePart } from 'src/app/project.service';
import { ConfirmDeletionDialog, RenameDialog } from '../../explorer/explorer.component';
import { ViewportService } from '../../viewport/viewport.service';
const Electron = window["nodeRequire"]("electron");
const FileSystem = window["nodeRequire"]("fs");
const Path = window["nodeRequire"]("path");
const Crypto = window["nodeRequire"]("crypto");

@Component({
  selector: 'vehicle-editor',
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.scss']
})
export class VehicleComponent implements OnInit {
  constructor(private projectService: ProjectService, private dialog: MatDialog, private viewport: ViewportService) { }

  getCurrentNode(): VehicleNode {
    return this.projectService.currentNode as VehicleNode;
  }

  ngOnInit(): void {
  }

  onTabChange(): void {
    this.viewport.refreshScene(this.getCurrentNode());
    this.viewport.resize();
    for(const name in this.viewport.modelMeshMap) {
      if(this.getCurrentNode().modelObjects.find(object => object.name === name) === undefined) {
        this.getCurrentNode().modelObjects.push(new ModelObject(name));
      }
    }
  }
}