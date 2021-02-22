import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ViewportService } from './viewport.service';

@Component({
  selector: 'app-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.scss']
})
export class ViewportComponent implements OnInit, AfterViewInit {
  @ViewChild("renderCanvas", {
    static: true
  })
  renderCanvas: ElementRef<HTMLCanvasElement>;
  
  @ViewChild("objectMenuTrigger", {
    read: MatMenuTrigger
  })
  objectMenuTrigger: MatMenuTrigger;

  objectMenuData = {
    x: "0px",
    y: "0px",
    object: undefined
  };

  constructor(private viewportService: ViewportService) { }

  ngOnInit(): void {
    this.viewportService.createScene(this.renderCanvas);
    this.viewportService.animate();
  }

  ngAfterViewInit(): void {
    this.viewportService.setMenuTrigger((x, y, name) => {
      this.objectMenuData.x = `${x}px`;
      this.objectMenuData.y = `${y}px`;
      this.objectMenuData.object = name;
      this.objectMenuTrigger.openMenu();
    });
  }
}
