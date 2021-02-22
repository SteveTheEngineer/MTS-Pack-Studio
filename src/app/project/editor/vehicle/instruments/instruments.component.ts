import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';
import { ProjectService, Vector2, VehicleInstrument, VehicleNode } from 'src/app/project.service';
import { ConfirmDeletionDialog } from 'src/app/project/explorer/explorer.component';

@Component({
  selector: 'vehicle-instruments',
  templateUrl: './instruments.component.html',
  styleUrls: ['./instruments.component.scss']
})
export class InstrumentsComponent implements OnInit {

  constructor(private projectService: ProjectService, private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  getCurrentNode(): VehicleNode {
    return this.projectService.currentNode as VehicleNode;
  }

  positionInstrumentInHUD(instrument: VehicleInstrument): void {
    this.dialog.open(InstrumentHUDDialog, {
      data: {
        instrument,
        otherInstruments: this.getCurrentNode().motorized.instruments.filter(otherInstrument => otherInstrument !== instrument)
      }
    });
  }

  getInstruments(): VehicleInstrument[] {
    return this.getCurrentNode().motorized.instruments;
  }
  
  addInstrument(): void {
    this.getCurrentNode().motorized.instruments.push(new VehicleInstrument(this.getCurrentNode().motorized.newInstrumentId++, "New Instrument"));
  }

  removeInstrument(instrument: VehicleInstrument): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `the instrument ${instrument.name}`,
        remove: true
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        this.getInstruments().splice(this.getInstruments().indexOf(instrument), 1);
      }
    });
  }
}

export interface InstrumentHUDDialogData {
  instrument: VehicleInstrument;
  otherInstruments: VehicleInstrument[];
}
@Component({
  selector: "instrumenthud-dialog",
  templateUrl: "./instrumenthud-dialog.html"
})
export class InstrumentHUDDialog implements AfterViewInit, OnDestroy {
  public static GUI_SCALE: Vector2 = [400, 140];

  @ViewChild("canvas")
  private canvasRef: ElementRef<HTMLCanvasElement>;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private renderSubscription: Subscription;
  private image: HTMLImageElement;

  public position: Vector2 = [0, 0];
  public scale: number = 1;

  public snap: boolean = false;
  public lockX: boolean = false;
  public lockY: boolean = false;

  constructor(private dialogRef: MatDialogRef<InstrumentHUDDialog>, @Inject(MAT_DIALOG_DATA) private data: InstrumentHUDDialogData) {
    this.position = [...data.instrument.hudPosition];
    this.scale = data.instrument.hudScale;
  }

  ngOnDestroy(): void {
    this.renderSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.image = new Image();
    this.image.src = "https://raw.githubusercontent.com/DonBruce64/MinecraftTransportSimulator/master/src/main/resources/assets/mts/textures/guis/hud.png";
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;
    this.image.addEventListener("load", () => {
      this.renderSubscription = interval(1 / 60).subscribe(() => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(this.image, 0, 0, InstrumentHUDDialog.GUI_SCALE[0], InstrumentHUDDialog.GUI_SCALE[1], 0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "rgba(255, 0, 0, 0.5)";
        this.context.fillRect(0, this.canvas.height / 2 - 1, this.canvas.width, 3);
        this.context.fillRect(0, this.canvas.height / 2 / 2 - 1, this.canvas.width, 3);
        this.context.fillStyle = "rgba(0, 0, 255, 0.5)";
        this.context.fillRect(this.canvas.width / 2 - 1, 0, 3, this.canvas.height);
        this.context.fillStyle = "rgba(0, 127, 127, 0.25)";
        for(const instrument of this.data.otherInstruments) {
          const size = 128 * 1.5 * instrument.hudScale;
          this.context.fillRect(instrument.hudPosition[0] * 1.5 - size / 2, instrument.hudPosition[1] * 1.5 - size / 2, size, size);
        }
        let tileX: number = this.position[0];
        let tileY: number = this.position[1];
        tileX *= 1.5;
        tileY *= 1.5;
        this.context.fillStyle = "rgba(255, 255, 255, 0.5)";
        const size = 128 * 1.5 * this.scale;
        this.context.fillRect(tileX - size / 2, tileY - size / 2, size, size);
        this.context.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.context.fillRect(tileX - 1, tileY - 1, 3, 3);
      });
    });
    let pointerDown = false;
    this.canvas.addEventListener("pointerdown", ev => {
      pointerDown = true;
    });
    this.canvas.addEventListener("pointerup", ev => {
      pointerDown = false;
    });
    this.canvas.addEventListener("pointermove", ev => {
      if(pointerDown) {
        if(!this.lockX) {
          this.position[0] = Math.max(0, Math.min(InstrumentHUDDialog.GUI_SCALE[0], this.position[0] + ev.movementX));
        }
        if(!this.lockY) {
          this.position[1] = Math.max(0, Math.min(InstrumentHUDDialog.GUI_SCALE[1], this.position[1] + ev.movementY));
        }
        if(this.snap && !ev.shiftKey) {
          if(Math.abs(this.position[0] - InstrumentHUDDialog.GUI_SCALE[0] / 2) < 3) {
            this.position[0] = InstrumentHUDDialog.GUI_SCALE[0] / 2;
          }
          if(Math.abs(this.position[1] - InstrumentHUDDialog.GUI_SCALE[1] / 2) < 3) {
            this.position[1] = InstrumentHUDDialog.GUI_SCALE[1] / 2;
          }
          if(Math.abs(this.position[1] - InstrumentHUDDialog.GUI_SCALE[1] / 2 / 2) < 3) {
            this.position[1] = InstrumentHUDDialog.GUI_SCALE[1] / 2 / 2;
          }
        }
      }
      ev.preventDefault();
    });
    this.canvas.addEventListener("keypress", ev => {
      if(ev.code === "KeyX") {
        this.lockX = !this.lockX;
      }
      if(ev.code === "KeyY") {
        this.lockY = !this.lockY;
      }
      if(ev.code === "KeyS") {
        this.snap = !this.snap;
      }
    });
    this.canvas.addEventListener("wheel", ev => {
      let delta: number = ev.deltaY / 800;
      if(ev.shiftKey) {
        delta /= 2;
      }
      this.scale = Math.max(0, this.scale - delta);
      ev.preventDefault();
    });
  }

  save(): void {
    let tileX: number = this.position[0];
    let tileY: number = this.position[1];
    this.data.instrument.hudPosition = [tileX, tileY];
    this.data.instrument.hudScale = this.scale;
    this.dialogRef.close();
  }
}