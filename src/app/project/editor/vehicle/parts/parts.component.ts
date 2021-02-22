import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CustomType, PartSubtype, ProjectService, VehicleNode, VehiclePart, PartTypes, PartType } from 'src/app/project.service';
import { ConfirmDeletionDialog } from 'src/app/project/explorer/explorer.component';

@Component({
  selector: 'vehicle-parts',
  templateUrl: './parts.component.html',
  styleUrls: ['./parts.component.scss']
})
export class PartsComponent implements OnInit {
  constructor(private projectService: ProjectService, private dialog: MatDialog) { }
  
  getCurrentNode(): VehicleNode {
    return this.projectService.currentNode as VehicleNode;
  }

  ngOnInit(): void {
  }

  getParts(): VehiclePart[] {
    return this.getCurrentNode().parts;
  }

  addPart(): void {
    this.getCurrentNode().parts.push(new VehiclePart(this.getCurrentNode().newPartId++, "New Part Location"));
  }

  removePart(part: VehiclePart): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the part location ${part.name}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.getParts().splice(this.getParts().indexOf(part), 1);
      }
    });
  }

  clonePart(part: VehiclePart): void {
    const newPart: VehiclePart = Object.assign(Object.create(Object.getPrototypeOf(part)), part);
    newPart.id = this.getCurrentNode().newPartId++;
    newPart.name = `Copy of ${newPart.name}`;
    this.getParts().push(newPart);
  }

  addCustomType(part: VehiclePart): void {
    this.dialog.open(AddCustomTypeDialog, {
      data: {
        customTypes: part.customTypes
      }
    });
  }

  addType(part: VehiclePart): void {
    this.dialog.open(AddTypeDialog, {
      data: {
        types: part.types
      }
    });
  }

  partAcceptsOneOf(part: VehiclePart, types: PartType[]): boolean {
    return part.types.find(declaredType => types.includes(declaredType.type)) !== undefined;
  }

  getAvailableDependencies(part: VehiclePart): VehiclePart[] {
    return this.getParts().filter(declaredPart => declaredPart !== part && !this.dependsOnRecursive(declaredPart, part));
  }

  dependsOnRecursive(dependant: VehiclePart, dependency: VehiclePart): boolean {
    if(dependant.dependsOn === -1) {
      return false;
    }
    if(dependant.dependsOn === dependency.id) {
      return true;
    }
    const dependantDependency: VehiclePart | undefined = this.getParts().find(part => part.id === dependant.dependsOn);
    if(dependantDependency !== undefined) {
      return this.dependsOnRecursive(dependantDependency, dependency);
    } else {
      return false;
    }
  }
}

export interface AddCustomTypeDialogData {
  customTypes: CustomType[];
}
@Component({
  selector: "addcustomtype-dialog",
  templateUrl: "./addcustomtype-dialog.html",
  styleUrls: ["./addcustomtype-dialog.scss"]
})
export class AddCustomTypeDialog {
  public error: string = "";
  public type: string = "";

  constructor(public dialogRef: MatDialogRef<AddCustomTypeDialog>, @Inject(MAT_DIALOG_DATA) private data: AddCustomTypeDialogData) {}

  public add(): void {
    if(this.data.customTypes.find(customType => customType.name === this.type) === undefined) {
      if(this.type !== "") {
        this.data.customTypes.push(new CustomType(this.type));
        this.dialogRef.close();
      } else {
        this.error = "The type name cannot be empty";
      }
    } else {
      this.error = "An identical custom type is already in the list";
    }
  }
}

export interface AddTypeDialogData {
  types: PartSubtype[];
}
@Component({
  selector: "addtype-dialog",
  templateUrl: "./addtype-dialog.html",
  styleUrls: ["./addtype-dialog.scss"]
})
export class AddTypeDialog {
  public type: PartSubtype = new PartSubtype("bullet", "");
  public error: string = "";

  constructor(public dialogRef: MatDialogRef<AddTypeDialog>, @Inject(MAT_DIALOG_DATA) private data: AddTypeDialogData) {}

  public getPartTypes(): readonly PartType[] {
    return PartTypes;
  }

  public add(): void {
    if(this.data.types.find(type => type.type === this.type.type && type.name === this.type.name) === undefined) {
      this.data.types.push(this.type);
      this.dialogRef.close();
    } else {
      this.error = "An identical type is already in the list";
    }
  }
}