import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ingredient, IngredientSet, ModelObject, NodeAsset, NodeAssetType, ProjectService, VehicleDefinition, VehicleNode } from 'src/app/project.service';
import { ConfirmDeletionDialog, RenameDialog } from 'src/app/project/explorer/explorer.component';
import { ViewportService } from 'src/app/project/viewport/viewport.service';
const Electron = window["nodeRequire"]("electron");
const Path = window["nodeRequire"]("path");
const Crypto = window["nodeRequire"]("crypto");
const FileSystem = window["nodeRequire"]("fs");

@Component({
  selector: 'vehicle-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit {

  constructor(private projectService: ProjectService, private dialog: MatDialog, private viewport: ViewportService) { }

  ngOnInit(): void {
  }

  getCurrentNode(): VehicleNode {
    return this.projectService.currentNode as VehicleNode;
  }

  addAsset(): void {
    Electron.remote.dialog.showOpenDialog({ 
      properties: [
        "openFile"
      ],
      filters: [
        {name: "Sound/Model/Texture File", extensions: ["ogg", "obj", "png"]}
      ]
    }).then(result => {
      if(result.filePaths.length >= 1) {
        const filePath: string = result.filePaths[0];
        const fileExtension: string = Path.extname(filePath).toLowerCase().slice(1);
        let type: NodeAssetType;
        if(fileExtension === "obj") {
          type = "model";
        } else if(fileExtension === "png") {
          type = "texture";
        } else if(fileExtension === "ogg") {
          type = "sound";
        } else {
          return;
        }
        const assetData: any = FileSystem.readFileSync(filePath);
        const hash = Crypto.createHash("sha256").update(assetData).digest("hex");
        const asset: NodeAsset = new NodeAsset(this.getCurrentNode().newAssetId++, Path.basename(filePath), hash, type);
        FileSystem.writeFileSync(Path.resolve(this.projectService.path, "assets", `${hash}.${fileExtension}`), assetData);
        this.getCurrentNode().assets.push(asset);
      }
    });
  }

  replaceAsset(asset: NodeAsset): void {
    Electron.remote.dialog.showOpenDialog({ 
      properties: [
        "openFile"
      ],
      filters: [
        {name: asset.type.charAt(0).toUpperCase() + asset.type.slice(1), extensions: [asset.getExtension()]}
      ]
    }).then(result => {
      if(result.filePaths.length >= 1) {
        const filePath: string = result.filePaths[0];
        const assetData: any = FileSystem.readFileSync(filePath);
        const hash = Crypto.createHash("sha256").update(assetData).digest("hex");
        asset.hash = hash;
        FileSystem.writeFileSync(Path.resolve(this.projectService.path, "assets", `${hash}.${Path.extname(filePath).toLowerCase().slice(1)}`), assetData);
      }
    });
  }

  renameAsset(asset: NodeAsset): void {
    this.dialog.open(RenameDialog, {
      data: {
        name: asset.name
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        asset.name = result;
      }
    });
  }

  removeAsset(asset: NodeAsset): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the asset ${asset.name}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.getCurrentNode().assets.splice(this.getCurrentNode().assets.indexOf(asset), 1);
      }
    });
  }

  getDefinitions(): VehicleDefinition[] {
    return this.getCurrentNode().definitions;
  }

  addDefinition(): void {
    this.getCurrentNode().definitions.push(new VehicleDefinition());
  }

  removeDefinition(definition: VehicleDefinition): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the vehicle definition ${definition.getName(this.getCurrentNode())}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.getCurrentNode().definitions.splice(this.getCurrentNode().definitions.indexOf(definition), 1);
      }
    });
  }

  getIngredientSets(): IngredientSet[] {
    return this.getCurrentNode().ingredientSets;
  }

  addIngredientSet(): void {
    this.getCurrentNode().ingredientSets.push(new IngredientSet(this.getCurrentNode().newIngredientSetId++, "New Ingredient Set"));
  }

  removeIngredientSet(set: IngredientSet): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the ingredient set ${set.name}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.getCurrentNode().ingredientSets.splice(this.getCurrentNode().ingredientSets.indexOf(set), 1);
      }
    });
  }

  addIngredient(set: IngredientSet): void {
    set.ingredients.push(new Ingredient("minecraft:stone"));
  }

  getAssets(types: NodeAssetType[]): NodeAsset[] {
    return this.getCurrentNode().assets.filter(asset => types.includes(asset.type));
  }

  addCustomVariable(): void {
    this.dialog.open(AddStringDialog, {
      data: {
        text: "Custom Variable",
        strings: this.getCurrentNode().rendering.customVariables
      }
    });
  }

  addHitchType(): void {
    this.dialog.open(AddStringDialog, {
      data: {
        text: "Hitch Type",
        strings: this.getCurrentNode().motorized.hitchTypes
      }
    });
  }
}

export interface AddStringDialogData {
  text: string;
  strings: string[];
}
@Component({
  selector: "addstring-dialog",
  templateUrl: "./addstring-dialog.html",
  styleUrls: ["./addstring-dialog.scss"]
})
export class AddStringDialog {
  public string: string = "";
  public error: string = "";

  public constructor(private dialogRef: MatDialogRef<AddStringDialog>, @Inject(MAT_DIALOG_DATA) public data: AddStringDialogData) {}

  public add(): void {
    if(!this.data.strings.includes(this.string)) {
      this.data.strings.push(this.string);
      this.dialogRef.close();
    } else {
      this.error = "An identical item is already in the list";
    }
  }
}