import { ElementRef, Injectable, NgZone } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { NodeAsset, ProjectService, VehicleNode } from "src/app/project.service";
import { Color, DoubleSide, HemisphereLight, Material, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Plane, PlaneGeometry, Renderer, Scene, Texture, TextureLoader, Vector3, WebGLRenderer } from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
const Path = window["nodeRequire"]("path");
const FileSystem = window["nodeRequire"]("fs");

@Injectable({
  providedIn: "root"
})
export class ViewportService {
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  public modelMeshMap: {[name: string]: Mesh} = {};
  private refreshTime: number = -1;

  private menuTrigger: (x: number, y: number, name: string) => void;

  constructor(private ngZone: NgZone, private projectService: ProjectService) { }

  public setMenuTrigger(menuTrigger: (x: number, y: number, name: string) => void): void {
    this.menuTrigger = menuTrigger;
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvas.nativeElement;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      precision: "highp",
      powerPreference: "high-performance",
      stencil: false
    });
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(70, this.canvas.parentElement.clientWidth / this.canvas.parentElement.clientHeight);
    this.renderer.setClearColor(0x303030);
    this.renderer.setSize(this.canvas.parentElement.clientWidth, this.canvas.parentElement.clientHeight);
    const controls = new OrbitControls(this.camera, this.canvas);
  }

  public refreshScene(vehicle: VehicleNode): void {
    this.scene.clear();

    for(const instrument of vehicle.motorized.instruments) {
      const instrumentModel: Mesh = new Mesh(new PlaneGeometry(8 * instrument.scale, 8 * instrument.scale), new MeshBasicMaterial({
        color: 0xff0000
      }));
      instrumentModel.position.set(instrument.position[0], instrument.position[1], instrument.position[2]);
      instrumentModel.rotation.set(instrument.rotation[0], Math.PI + instrument.rotation[1], instrument.rotation[2]);
      this.scene.add(instrumentModel);
    }
    
    this.scene.add(new HemisphereLight(0xffffff, 0xffffff, 100));

    this.modelMeshMap = {};
    if(vehicle.modelAsset !== undefined) {
      const asset: NodeAsset | undefined = vehicle.assets.find(asset => asset.id === vehicle.modelAsset);
      if(asset !== undefined && asset.type === "model") {
        const textureAsset: NodeAsset | undefined = vehicle.assets.find(asset => asset.id === vehicle.definitions[0].textureAsset);
        const textureMaterial: MeshBasicMaterial = new MeshBasicMaterial();
        if(textureAsset !== undefined) {
          textureMaterial.map = new TextureLoader().load(`data:image/png;base64,${FileSystem.readFileSync(Path.resolve(this.projectService.path, "assets", `${textureAsset.hash}.png`)).toString("base64")}`);
        }
        const object: Object3D = new OBJLoader().parse(FileSystem.readFileSync(Path.resolve(this.projectService.path, "assets", `${asset.hash}.obj`)).toString());
        for(const child of object.children) {
          const mesh: Mesh = child as Mesh;
          let material: MeshBasicMaterial = textureMaterial;
          if(child.name.toLowerCase().includes("window")) {
            material = new MeshBasicMaterial();
            material.opacity = 0.25;
            material.transparent = true;
            material.side = DoubleSide;
          }
          mesh.material = material;
          this.modelMeshMap[mesh.name] = mesh;
        }
        this.camera.position.z = 5;
        this.scene.add(object);
    }
    }
    this.refreshTime = Date.now();
  }

  public resize(): void {
    this.renderer.setSize(this.canvas.parentElement.clientWidth, this.canvas.parentElement.clientHeight);
    this.camera.aspect = this.canvas.parentElement.clientWidth / this.canvas.parentElement.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  public animate(): void {
      const render = () => {
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(render);
      };
      
      addEventListener("resize", () => {
        this.resize();
      });

      if(window.document.readyState !== "loading") {
        render();
      } else {
        addEventListener("load", () => {
          render();
        });
      }
  }
}
