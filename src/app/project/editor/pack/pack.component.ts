import { Component, OnInit } from '@angular/core';
import { Node, ProjectService } from 'src/app/project.service';

@Component({
  selector: 'pack-editor',
  templateUrl: './pack.component.html',
  styleUrls: ['./pack.component.scss']
})
export class PackComponent implements OnInit {

  constructor(private projectService: ProjectService) { }

  getCurrentNode(): Node {
    return this.projectService.currentNode;
  }

  ngOnInit(): void {
  }

}
