import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Animation, NodeAsset, NodeAssetType, PartType, VehiclePart } from 'src/app/project.service';
import { ConfirmDeletionDialog } from 'src/app/project/explorer/explorer.component';

@Component({
  selector: 'shared-animations',
  templateUrl: './animations.component.html',
  styleUrls: ['./animations.component.scss']
})
export class AnimationsComponent implements OnInit {
  @Input()
  animations: Animation[];

  @Input()
  assets: NodeAsset[];

  @Input()
  parts: VehiclePart[] | undefined;

  @Input()
  customVariables: string[];

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  addAnimation(): void {
    this.animations.push(new Animation("New Animation"));
  }
  
  getAssets(types: NodeAssetType[]): NodeAsset[] {
    return this.assets.filter(asset => types.includes(asset.type));
  }
  
  canMoveUp(animation: Animation): boolean {
    return this.animations.indexOf(animation) > 0;
  }

  canMoveDown(animation: Animation): boolean {
    return this.animations.indexOf(animation) < this.animations.length - 1;
  }

  removeAnimation(animation: Animation): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the animation ${animation.name}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.animations.splice(this.animations.indexOf(animation), 1);
      }
    });
  }

  moveUp(animation: Animation): void {
    const index: number = this.animations.indexOf(animation);
    const old: Animation = this.animations[index - 1];
    this.animations[index - 1] = animation;
    this.animations[index] = old;
  }

  moveDown(animation: Animation): void {
    const index: number = this.animations.indexOf(animation);
    const old: Animation = this.animations[index + 1];
    this.animations[index + 1] = animation;
    this.animations[index] = old;
  }

  cloneAnimation(animation: Animation): void {
    const newAnimation: Animation = Object.assign(Object.create(Object.getPrototypeOf(animation)), animation);
    newAnimation.name = `Copy of ${newAnimation.name}`;
    this.animations.push(newAnimation);
  }

  acceptsType(partId: number, type: PartType): boolean {
    const part: VehiclePart | undefined = this.parts.find(part => part.id === partId);
    return part !== undefined && part.types.find(partType => partType.type === type) !== undefined;
  }
}
