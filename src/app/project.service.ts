import { Component, HostListener, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { interval } from 'rxjs';
const FileSystem = window["nodeRequire"]("fs");
const Path = window["nodeRequire"]("path");
const OperatingSystem = window["nodeRequire"]("os");
const Electron = window["nodeRequire"]("electron");


export type NodeType = "pack" | "folder" | "vehicle" | "part" | "instrument" | "decor" | "pole" | "booklet" | "skin" | "core";
export type FileStructure = "default" | "layered" | "modular";
export class Ingredient {
  public itemId: string;
  public meta: number = 0;
  public amount: number = 1;

  public constructor(itemId: string) {
    this.itemId = itemId;
  }

  public toString(): string {
    return `${this.itemId}:${this.meta}:${this.amount}`;
  }

  public save(): object {
    return {
      itemId: this.itemId,
      meta: this.meta,
      amount: this.amount
    };
  }

  public load(data: any): void {
    this.meta = data.meta;
    this.amount = data.amount;
  }
}
export class Node {
  public name: string;
  public id: string = "";
  public type: NodeType;
  public children: Node[];
  public parent: Node;

  public constructor(name: string, type: NodeType, children: Node[] = []) {
    this.name = name;
    this.type = type;
    this.children = children;
    for(const child of this.children) {
      child.parent = this;
    }
  }

  public getId(): string {
    return this.id || this.name.toLowerCase().replace(/ /g, "_").replace(/[^a-z0-9_]/g, "");
  }

  public isOriginatedFrom(node: Node): boolean {
    return this === node || this.parent === node || (this.parent !== undefined && this.parent.isOriginatedFrom(node));
  }

  public save(): object {
    return {
      name: this.name,
      id: this.id,
      type: this.type,
      children: this.children.map(child => child.save())
    };
  }

  public load(data: any, parent: Node | undefined = undefined): void {
    this.parent = parent;
    this.id = data.id;
    this.children = data.children.map(childData => {
      let node: Node;
      if(childData.type === "pack") {
        node = new PackNode(childData.name);
      } else if(childData.type === "vehicle") {
        node = new VehicleNode(childData.name);
      } else {
        node = new Node(childData.name, childData.type, []);
      }
      node.load(childData, this);
      return node;
    });
  }
}
export type Vector3 = [number, number, number];
export type Vector2 = [number, number];
export type MotorizedDrive = "none" | "front" | "rear" | "full";
export class PackNode extends Node {
  public fileStructure: FileStructure = "default";
  public activators: Map<string, string> = new Map();
  public blockers: Map<string, string> = new Map();
  public dependents: string[] = [];

  public constructor(name: string) {
    super(name, "pack");
  }

  public getId(): string {
    return this.id || super.getId().replace(/_/g, "");
  }

  public save(): object {
    return {
      ...super.save(),
      fileStructure: this.fileStructure,
      activators: [...this.activators.entries()],
      blockers: [...this.blockers.entries()],
      dependents: this.dependents
    };
  }

  public load(data: any, parent: Node | undefined = undefined): void {
    super.load(data, parent);
    this.fileStructure = data.fileStructure;
    this.activators = new Map(data.activators);
    this.blockers = new Map(data.blockers);
    this.dependents = data.dependents;
  }
}
export class VehicleDefinition {
  public textureAsset: number = -1;
  public secondTone: string = "";
  public secondColor: string = "";
  public name: string = "";
  public description: string = "";
  public extraMaterials: number = -1;

  public getName(parent: VehicleNode): string {
    return this.name || parent.name;
  }

  public save(): object {
    return {
      textureAsset: this.textureAsset,
      secondTone: this.secondTone,
      secondColor: this.secondColor,
      name: this.name,
      description: this.description,
      extraMaterials: this.extraMaterials
    };
  }

  public load(data: any): void {
    this.textureAsset = data.modelAsset;
    this.secondTone = data.secondTone;
    this.secondColor = data.secondColor;
    this.name = data.name;
    this.description = data.description;
    this.extraMaterials = data.extraMaterials;
  }
}
export class VehicleInstrument {
  public id: number;
  public name: string;
  public position: Vector3 = [0, 0, 0];
  public scale: number = 1;
  public rotation: Vector3 = [0, 0, 0];
  public hudPosition: Vector2 = [0, 0];
  public hudScale: number = 1;
  public partNumber: number = -1;
  public defaultInstrument: string = "";
  public animations: Animation[] = [];
  
  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public save(): object {
    return {
      position: this.position,
      scale: this.scale,
      rotation: this.rotation,
      hudPosition: this.hudPosition,
      hudScale: this.hudScale,
      partNumber: this.partNumber,
      defaultInstrument: this.defaultInstrument,
      animations: this.animations,
      name: this.name,
      id: this.id
    };
  }

  public load(data: any): void {
    this.position = data.position;
    this.scale = data.scale;
    this.rotation = data.rotation;
    this.hudPosition = data.hudPosition;
    this.hudScale = data.hudScale;
    this.partNumber = this.partNumber;
    this.defaultInstrument = this.defaultInstrument;
    this.animations = this.animations;
    this.name = name;
    this.id = data.id;
  }
}
export class VehicleMotorized {
  public isBigTruck: boolean = false;
  public isTrailer: boolean = false;
  public drive: MotorizedDrive = "none";
  public hasCruiseControl: boolean = false;
  public hasAutopilot: boolean = false;
  public hasFlaps: boolean = false;
  public fuelCapacity: number = 0;
  public defaultFuelQty: number = 0;
  public downForce: number = 1;
  public axleRatio: number = 1;
  public dragCoefficient: number | undefined;
  public tailDistance: number = 0;
  public wingSpan: number = 0;
  public wingArea: number = 0;
  public aileronArea: number = 0;
  public elevatorArea: number = 0;
  public rudderArea: number = 0;
  public crossSectionalArea: number = 0;
  public ballastVolume: number = 0;
  public gearSequenceDuration: number = 0;
  public hornSound: number = -1;
  public sirenSound: number = -1;
  public hitchPos: Vector3 = [0, 0, 0];
  public useHitchPos: boolean = false;
  public hitchTypes: string[] = [];
  public hookupPos: Vector3 = [0, 0, 0];
  public useHookupPos: boolean = false;
  public hookupType: string = "";
  public instruments: VehicleInstrument[] = [];
  public newInstrumentId: number = 0;

  public save(): object {
    return {
      isBigTruck: this.isBigTruck,
      isTrailer: this.isTrailer,
      drive: this.drive,
      hasCruiseControl: this.hasCruiseControl,
      hasAutopilot: this.hasAutopilot,
      hasFlaps: this.hasFlaps,
      fuelCapacity: this.fuelCapacity,
      defaultFuelQty: this.defaultFuelQty,
      downForce: this.downForce,
      axleRatio: this.axleRatio,
      dragCoefficient: this.dragCoefficient,
      tailDistance: this.tailDistance,
      wingSpan: this.wingSpan,
      wingArea: this.wingArea,
      aileronArea: this.aileronArea,
      elevatorArea: this.elevatorArea,
      rudderArea: this.rudderArea,
      crossSectionalArea: this.crossSectionalArea,
      ballastVolume: this.ballastVolume,
      gearSequenceDuration: this.gearSequenceDuration,
      hornSound: this.hornSound,
      sirenSound: this.sirenSound,
      hitchPos: this.hitchPos,
      hitchTypes: this.hitchTypes,
      hookupPos: this.hookupPos,
      hookupType: this.hookupType,
      instruments: this.instruments.map(instrument => instrument.save()),
      newInstrumentId: this.newInstrumentId
    };
  }

  public load(data: any): void {
    this.isBigTruck = data.isBigTruck;
    this.isTrailer = data.isTrailer;
    this.drive = data.drive;
    this.hasCruiseControl = data.hasCruiseControl;
    this.hasAutopilot = data.hasAutopilot;
    this.hasFlaps = data.hasFlaps;
    this.fuelCapacity = data.fuelCapacity;
    this.defaultFuelQty = data.defaultFuelQty;
    this.downForce = data.downForce;
    this.axleRatio = data.axleRatio;
    this.dragCoefficient = data.dragCoefficient;
    this.tailDistance = data.tailDistance;
    this.wingSpan = data.wingSpan;
    this.wingArea = data.wingArea;
    this.aileronArea = data.aileronArea;
    this.elevatorArea = data.elevatorArea;
    this.rudderArea = data.rudderArea;
    this.crossSectionalArea = data.crossSectionalArea;
    this.ballastVolume = data.ballastVolume;
    this.gearSequenceDuration = data.gearSequenceDuration;
    this.hornSound = data.hornSound;
    this.sirenSound = data.sirenSound;
    this.hitchPos = data.hitchPos;
    this.hitchTypes = data.hitchTypes;
    this.hookupPos = data.hookupPos;
    this.hookupType = data.hookupType;
    this.instruments = data.instruments.map(instrumentData => {
      const instrument: VehicleInstrument = new VehicleInstrument(instrumentData.id, instrumentData.name);
      instrument.load(instrumentData);
      return instrument;
    });
    this.newInstrumentId = data.newInstrumentId;
  }
}
export class VehicleGeneral {
  public isAircraft: boolean = false;
  public isBlimp: boolean = false;
  public openTop: boolean = false;
  public emptyMass: number = 0;
  public materials: number | undefined;

  public save(): object {
    return {
      isAircraft: this.isAircraft,
      isBlimp: this.isBlimp,
      openTop: this.openTop,
      emptyMass: this.emptyMass,
      materials: this.materials
    };
  }

  public load(data: any): void {
    this.isAircraft = data.isAircraft;
    this.isBlimp = data.isBlimp;
    this.openTop = data.openTop;
    this.emptyMass = data.emptyMass;
    this.materials = data.materials;
  }
}
export type NodeAssetType = "sound" | "model" | "texture";
export class NodeAsset {
  public id: number;
  public name: string;
  public hash: string;
  public type: NodeAssetType;

  public constructor(id: number, name: string, hash: string, type: NodeAssetType) {
    this.id = id;
    this.name = name;
    this.hash = hash;
    this.type = type;
  }

  public getExtension(): string {
    switch(this.type) {
      case "model":
        return "obj";
      case "sound":
        return "ogg";
      case "texture":
        return "png";
      default:
        return "";
    }
  }

  public save(): object {
    return {
      id: this.id,
      name: this.name,
      hash: this.hash,
      type: this.type
    };
  }
}
export class IngredientSet {
  public id: number;
  public name: string;
  public ingredients: Ingredient[] = [];

  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public save(): object {
    return {
      id: this.id,
      name: this.name,
      ingredients: this.ingredients.map(ingredient => ingredient.save())
    };
  }

  public load(data: any): void {
    this.ingredients = data.ingredients.map(ingredientData => {
      const ingredient: Ingredient = new Ingredient(ingredientData.itemId);
      ingredient.load(ingredientData);
      return ingredient;
    });
  }
}
export const PartTypes = [
  "engine",
  "ground",
  "propeller",
  "seat",
  "gun",
  "bullet",
  "interactable",
  "effector",
  "custom"
] as const;
export type PartType = typeof PartTypes[number];
export class PartSubtype {
  public type: PartType;
  public name: string;

  public constructor(type: PartType, name: string) {
    this.type = type;
    this.name = name;
  }

  public save(): object {
    return {
      type: this.type,
      name: this.name
    };
  }
}
export class CustomType {
  public name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public save(): object {
    return {
      name: this.name
    };
  }
}
export type PositionMode = "disable" | "relative" | "absolute";
export class VehiclePart {
  public id: number;
  public name: string;
  public dependsOn: number = -1;
  public position: Vector3 = [0, 0, 0];
  public rotation: Vector3 = [0, 0, 0];
  public turnsWithSteer: boolean = false;
  public isController: boolean = false;
  public isPermanent: boolean = false;
  public inverseMirroring: boolean = false;
  public types: PartSubtype[] = [];
  public customTypes: CustomType[] = [];
  public acceptWithoutCustomType: boolean = false;
  public valueRange: Vector2 = [0, 0];
  public useMinValue: boolean = false;
  public useMaxValue: boolean = false;
  public dismountPosition: Vector3 = [0, 0, 0];
  public dismountPositionMode: PositionMode = "disable";
  public seatEffects: [] = [];
  public particleObjects: [] = [];
  public intakeOffset: number = 0;
  public extraCollisionBoxOffset: number = 0;
  public useExtraCollisionBoxOffset: boolean = false;
  public treadDroopConstant: number;
  public useTreadDroopConstant: boolean = false;
  public defaultPart: string = "";
  public linkedDoors: string[] = [];
  public animations: Animation[] = [];

  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public save(): object {
    return {
      id: this.id,
      name: this.name,
      dependsOn: this.dependsOn,
      position: this.position,
      rotation: this.rotation,
      turnsWithSteer: this.turnsWithSteer,
      isController: this.isController,
      isPermanent: this.isPermanent,
      inverseMirroring: this.inverseMirroring,
      types: this.types.map(type => type.save()),
      customTypes: this.customTypes.map(customType => customType.save()),
      acceptWithoutCustomType: this.acceptWithoutCustomType,
      valueRange: this.valueRange,
      useMinValue: this.useMinValue,
      useMaxValue: this.useMaxValue,
      dismountPosition: this.dismountPosition,
      dismountPositionMode: this.dismountPositionMode,
      seatEffects: this.seatEffects,
      particleObjects: this.particleObjects,
      intakeOffset: this.intakeOffset,
      extraCollisionBoxOffset: this.extraCollisionBoxOffset,
      useExtraCollisionBoxOffset: this.useExtraCollisionBoxOffset,
      treadDroopConstant: this.treadDroopConstant,
      useTreadDroopConstant: this.useTreadDroopConstant,
      defaultPart: this.defaultPart,
      linkedDoors: this.linkedDoors,
      animations: this.animations.map(animation => animation)
    };
  }

  public load(data: any): void {
    this.dependsOn = data.dependsOn;
    this.position = data.position;
    this.rotation = data.rotation;
    this.turnsWithSteer = data.turnsWithSteer;
    this.isController = data.isController;
    this.isPermanent = data.isPermanent;
    this.inverseMirroring = data.inverseMirroring;
    this.types = data.types.map(typeData => new PartSubtype(typeData.type, typeData.name));
    this.customTypes = data.customTypes.map(customTypeData => new CustomType(customTypeData.name));
    this.acceptWithoutCustomType = data.acceptWithoutCustomType;
    this.valueRange = data.valueRange;
    this.useMaxValue = data.useMaxValue;
    this.useMinValue = data.useMinValue;
    this.dismountPosition = data.dismountPosition;
    this.dismountPositionMode = data.dismountPositionMode;
    this.seatEffects = data.seatEffects;
    this.particleObjects = data.particleObjects;
    this.intakeOffset = data.intakeOffset;
    this.extraCollisionBoxOffset = data.extraCollisionBoxOffset;
    this.useExtraCollisionBoxOffset = data.useExtraCollisionBoxOffset;
    this.treadDroopConstant = data.treadDroopConstant;
    this.useTreadDroopConstant = data.useTreadDroopConstant;
    this.defaultPart = data.defaultPart;
    this.linkedDoors = data.linkedDoors;
    this.animations = data.animations.map(animationData => animationData);
  }
}
export class ModelObject {
  public name: string;
  public applyAfter: string = "";
  public animations: Animation[] = [];

  public constructor(name: string) {
    this.name = name;
  }

  public save(): object {
    return {
      name: this.name,
      applyAfter: this.applyAfter,
      animations: this.animations.map(animation => animation.save())
    };
  }

  public load(data: any): void {
    this.applyAfter = data.applyAfter;
    this.animations = data.animations.map(animationData => {
      const animation: Animation = new Animation(animationData.name);
      animation.load(animationData);
      return animation;
    });
  }
}
export type AnimationType = "rotation" | "translation" | "visibility" | "inhibitor" | "activator";
export class Animation {
  public name: string;
  public animationType: AnimationType = "rotation";
  public target: "" | "vehicle" | "part" | "door" | "missile" | "customVariable" = "";
  public targetId: string | number = -1;
  public targetId2: number = 0;
  public variable: string = "";
  public centerPoint: Vector3 = [0, 0, 0];
  public axis: Vector3 = [0, 0, 0];
  public offset: number = 0;
  public addPriorOffset: boolean = false;
  public clamp: Vector2 = [0, 0];
  public useClampMin: boolean = false;
  public useClampMax: boolean = false;
  public absolute: boolean = false;
  public duration: number = 0;
  public forwardsDelay: number = 0;
  public reverseDelay: number = 0;
  public forwardsStartSound: number = -1;
  public forwardsEndSound: number = -1;
  public reverseStartSound: number = -1;
  public reverseEndSound: number = -1;

  public constructor(name: string) {
    this.name = name;
  }

  public save(): object {
    return {
      name: this.name,
      animationType: this.animationType,
      target: this.target,
      targetId: this.targetId,
      variable: this.variable,
      centerPoint: this.centerPoint,
      axis: this.axis,
      offset: this.offset,
      addPriorOffset: this.addPriorOffset,
      clamp: this.clamp,
      useClampMin: this.useClampMin,
      useClampMax: this.useClampMax,
      absolute: this.absolute,
      duration: this.duration,
      forwardsDelay: this.forwardsDelay,
      reverseDelay: this.reverseDelay,
      forwardsStartSound: this.forwardsStartSound,
      forwardsEndSound: this.forwardsEndSound,
      reverseStartSound: this.reverseStartSound,
      reverseEndSound: this.reverseEndSound
    };
  }

  public load(data: any): void {
    this.animationType = data.animationType;
    this.target = data.target;
    this.targetId = data.targetId;
    this.variable = data.variable;
    this.centerPoint = data.centerPoint;
    this.axis = data.axis;
    this.offset = data.offset;
    this.addPriorOffset = data.addPriorOffset;
    this.clamp = data.clamp;
    this.useClampMin = data.useClampMin;
    this.useClampMax = data.useClampMax;
    this.absolute = data.absolute;
    this.duration = data.duration;
    this.forwardsDelay = data.forwardsDelay;
    this.reverseDelay = data.reverseDelay;
    this.forwardsStartSound = data.forwardsStartSound;
    this.forwardsEndSound = data.forwardsEndSound;
    this.reverseStartSound = data.reverseStartSound;
    this.reverseEndSound = data.reverseEndSound;
  }
}
export class VehicleRendering {
  public hudTextureAsset: number = -1;
  public litHudTextureAsset: number = -1;
  public panelTextureAsset: number = -1;
  public panelTextColor: string = "#ffffff";
  public panelLitTextColor: string = "#ffffff";
  public customVariables: string[] = [];
  public textObjects: [] = [];
  public cameraObjects: [] = [];

  public save(): object {
    return {
      hudTextureAsset: this.hudTextureAsset,
      litHudTextureAsset: this.litHudTextureAsset,
      panelTextureAsset: this.panelTextureAsset,
      panelTextColor: this.panelTextColor,
      panelLitTextColor: this.panelLitTextColor,
      customVariables: this.customVariables,
      textObjects: this.textObjects,
      cameraObjects: this.cameraObjects
    }
  }

  public load(data: any): void {
    this.hudTextureAsset = data.hudTextureAsset;
    this.litHudTextureAsset = data.litHudTextureAsset;
    this.panelTextureAsset = data.panelTextureAsset;
    this.panelTextColor = data.panelTextColor;
    this.panelLitTextColor = data.panelLitTextColor;
    this.customVariables = data.customVariables;
    this.textObjects = data.textObjects;
    this.cameraObjects = data.cameraObjects;
  }
}
export class VehicleNode extends Node {
  public definitions: VehicleDefinition[] = [
    new VehicleDefinition()
  ];
  public general: VehicleGeneral = new VehicleGeneral();
  public motorized: VehicleMotorized = new VehicleMotorized();
  public assets: NodeAsset[] = [];
  public ingredientSets: IngredientSet[] = [];
  public parts: VehiclePart[] = [];
  public newAssetId: number = 0;
  public newIngredientSetId: number = 0;
  public newPartId: number = 0;
  public modelAsset: number = -1;
  public modelObjects: ModelObject[] = [];
  public rendering: VehicleRendering = new VehicleRendering();

  public constructor(name: string) {
    super(name, "vehicle");
  }

  public save(): object {
    return {
      ...super.save(),
      definitions: this.definitions.map(definition => definition.save()),
      general: this.general.save(),
      motorized: this.motorized.save(),
      assets: this.assets.map(asset => asset.save()),
      ingredientSets: this.ingredientSets.map(set => set.save()),
      parts: this.parts.map(part => part.save()),
      newAssetId: this.newAssetId,
      newIngredientSetId: this.newIngredientSetId,
      newPartId: this.newPartId,
      modelAsset: this.modelAsset,
      modelObjects: this.modelObjects.map(modelObject => modelObject.save()),
      rendering: this.rendering.save()
    }
  }

  public load(data: any, parent: Node | undefined = undefined): void {
    super.load(data, parent);
    this.definitions = data.definitions.map(data => {
      const definition: VehicleDefinition = new VehicleDefinition();
      definition.load(data);
      return definition;
    });
    this.general.load(data.general);
    this.motorized.load(data.motorized);
    this.assets = data.assets.map(assetData => new NodeAsset(assetData.id, assetData.name, assetData.hash, assetData.type));
    this.ingredientSets = data.ingredientSets.map(setData => {
      const ingredientSet: IngredientSet = new IngredientSet(setData.id, setData.name);
      ingredientSet.load(setData);
      return ingredientSet;
    });
    this.parts = data.parts.map(partData => {
      const part: VehiclePart = new VehiclePart(partData.id, partData.name);
      part.load(partData);
      return part;
    });
    this.newAssetId = data.newAssetId;
    this.newIngredientSetId = data.newIngredientSetId;
    this.newPartId = data.newPartId;
    this.modelAsset = data.modelAsset;
    this.modelObjects = data.modelObjects.map(modelObjectData => {
      const modelObject: ModelObject = new ModelObject(modelObjectData.name);
      modelObject.load(modelObjectData);
      return modelObject;
    });
    this.rendering.load(data.rendering);
  }
}

export interface RecentProject {
  path: string;
  name: string;
  time: number;
}
export type LoadResult = "success" | "invalid" | "corrupted" | "upgrade_required" | "studio_outdated";
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public static PROJECT_FORMAT: number = 0;

  public nodes: Node[] = [];
  public currentNode: Node | undefined;
  public path: string | undefined;
  public recentProjects: RecentProject[] = [];
  public name: string | undefined = undefined;
  public saveInProgress: boolean = false;

  private exitConfirmed: boolean = false;

  constructor(private dialog: MatDialog) {
    this.loadRecentProjects();
    interval(10000).subscribe(() => {
      this.save();
    });
    addEventListener("beforeunload", ev => {
      if(this.name !== undefined && !this.exitConfirmed) {
        ev.returnValue = "";
        this.dialog.open(ConfirmExitDialog).afterClosed().subscribe(result => {
          if(result) {
            this.save();
            this.exitConfirmed = true;
            Electron.remote.app.quit();
          }
        });
      }
    });
  }

  getRecentProjects(): RecentProject[] {
    return this.recentProjects.sort((a, b) => b.time - a.time);
  }
  
  addRecentProject(project: RecentProject) {
    this.recentProjects = this.recentProjects.filter(recent => recent.path !== project.path);
    this.recentProjects.push(project);
  }

  loadRecentProjects(): void {
    try {
      this.recentProjects = JSON.parse(FileSystem.readFileSync(Path.resolve(OperatingSystem.homedir(), ".mts_studio_recent_projects.json")).toString());
      for(const recentProject of this.recentProjects) {
        recentProject.name = JSON.parse(FileSystem.readFileSync(Path.resolve(recentProject.path, "mts_studio_project.json")).toString()).name;
      }
    } catch(e) {}
  }
  
  saveRecentProjects(): void {
    FileSystem.writeFileSync(Path.resolve(OperatingSystem.homedir(), ".mts_studio_recent_projects.json"), JSON.stringify(this.recentProjects.map(recentProject => ({
      path: recentProject.path,
      time: recentProject.time
    }))));
  }

  load(path: string): LoadResult {
    this.path = path;
    let nodesData: any[];
    let projectData: {name: string, format: number};
    try {
      projectData = JSON.parse(FileSystem.readFileSync(Path.resolve(this.path, "mts_studio_project.json")).toString());
    } catch(e) {
      return "invalid";
    }
    if(projectData.format > ProjectService.PROJECT_FORMAT) {
      return "studio_outdated";
    } else if(projectData.format < ProjectService.PROJECT_FORMAT) {
      return "upgrade_required";
    }
    this.name = projectData.name;
    try {
      nodesData = JSON.parse(FileSystem.readFileSync(Path.resolve(this.path, "nodes.json")).toString());
    } catch(e) {
      try {
        nodesData = JSON.parse(FileSystem.readFileSync(Path.resolve(this.path, "nodes.json.backup")).toString());
      } catch(e) {
        return "corrupted";
      }
    }
    const tempNode: Node = new Node("root", "folder", []);
    tempNode.load({
      children: nodesData
    }, undefined);
    this.nodes = tempNode.children;
    this.addRecentProject({
      name: projectData.name,
      path,
      time: Date.now()
    });
    this.saveRecentProjects();
    return "success";
  }

  save(): void {
    if(!this.saveInProgress && this.name !== undefined) {
      this.saveInProgress = true;
      FileSystem.copyFileSync(Path.resolve(this.path, "nodes.json"), Path.resolve(this.path, "nodes.json.backup"));
      FileSystem.writeFileSync(Path.resolve(this.path, "nodes.json"), JSON.stringify(this.nodes.map(node => node.save())));
      this.saveInProgress = false;
    }
  }
}

@Component({
  selector: "confirmexit-dialog",
  templateUrl: "./confirmexit-dialog.html"
})
export class ConfirmExitDialog {
  constructor(dialogRef: MatDialogRef<ConfirmExitDialog>) {}
}