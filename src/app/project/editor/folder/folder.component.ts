import { Component, OnInit } from '@angular/core';
import { Node, ProjectService } from 'src/app/project.service';

@Component({
  selector: 'folder-editor',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss']
})
export class FolderComponent implements OnInit {

  constructor(private projectService: ProjectService) { }

  getCurrentNode(): Node {
    return this.projectService.currentNode;
  }

  ngOnInit(): void {
  }

}
