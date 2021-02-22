import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Node, NodeType, PackNode, ProjectService, RecentProject, VehicleNode } from 'src/app/project.service';

export interface FlatNode {
  level: number;
  node: Node;
}
@Component({
  selector: 'project-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit {

  constructor(private projectService: ProjectService, private dialog: MatDialog, private router: Router, private title: Title) { }

  selection = new SelectionModel<FlatNode>(true);

  flatNodeMap = new Map<Node, FlatNode>();

  treeControl = new FlatTreeControl<FlatNode>(node => node.level, node => this.isExpandable(node.level, node));
  treeFlattener = new MatTreeFlattener<Node, FlatNode>((node, level) => {
    const existingNode = this.flatNodeMap.get(node);
    const flatNode: FlatNode = existingNode && existingNode.node.name === node.name ? existingNode : {
      level: level,
      node
    };

    this.flatNodeMap.set(node, flatNode);

    return flatNode;
  }, node => node.level, node => this.isExpandable(node.level, node), node => node.children);
  dataSource = new MatTreeFlatDataSource<Node, FlatNode>(this.treeControl, this.treeFlattener);

  nodeMenuPosition = {
    x: "0px",
    y: "0px"
  };
  @ViewChild("nodeMenuTrigger", {
    read: MatMenuTrigger
  })
  nodeMenuTrigger: MatMenuTrigger;

  selectedNode: FlatNode | undefined;

  multiSelection: boolean = false;
  recursiveSelection: boolean = false;

  isExpandable(level: number, node: FlatNode): boolean {
    return node.node.type === "pack" || node.node.type === "folder";
  }

  newNode(type: NodeType): void {
    let node: Node;
    if(type === "vehicle") {
      node = new VehicleNode(`New vehicle`);
    } else {
      node = new Node(`New ${type}`, type);
    }
    node.parent = this.selectedNode.node;
    this.selectedNode.node.children.push(node);
    this.treeControl.expand(this.selectedNode);
    this.refreshTree();
  }

  newRootNode(type: NodeType): void {
    let node: Node;
    if(type === "pack") {
      node = new PackNode(`New pack`);
    } else {
      node = new Node(`New ${type}`, type, [])
    }
    this.projectService.nodes.push(node);
    this.refreshTree();
  }

  deleteNode(confirmed: boolean = false): void {
    if(confirmed) {
      let children: Node[];
      if(this.selectedNode.node.parent !== undefined) {
        children = this.selectedNode.node.parent.children;
      } else {
        children = this.projectService.nodes;
      }
      children.splice(children.indexOf(this.selectedNode.node), 1);
      if(this.projectService.currentNode === this.selectedNode.node) {
        this.projectService.currentNode = undefined;
      }
      this.selectedNode = undefined;
      this.refreshTree();
    } else {
      this.dialog.open(ConfirmDeletionDialog, {
        data: {
          text: `the ${this.selectedNode.node.type} ${this.selectedNode.node.name}`,
          remove: false
        }
      }).afterClosed().subscribe(result => {
        if(result) {
          this.deleteNode(true);
        }
      });
    }
  }

  moveToCurrent(): void {
    const node: Node = this.selectedNode.node;
    node.parent.children.splice(node.parent.children.indexOf(node), 1);
    const newNode: Node = Object.assign(Object.create(Object.getPrototypeOf(this.selectedNode.node)), this.selectedNode.node);
    this.projectService.currentNode.children.push(newNode);
    newNode.parent = this.projectService.currentNode;
    this.treeControl.expand(this.flatNodeMap.get(this.projectService.currentNode));
    this.refreshTree();
  }

  canMoveToCurrent(): boolean {
    return this.projectService.currentNode != null && (this.projectService.currentNode.type === "pack" || this.projectService.currentNode.type === "folder") && !this.projectService.currentNode.isOriginatedFrom(this.selectedNode.node);
  }

  duplicate(): void {
    let copy: any = Object.assign(Object.create(Object.getPrototypeOf(this.selectedNode.node)), this.selectedNode.node);
    copy.name = `Copy of ${copy.name}`;
    if(this.selectedNode.node.parent !== undefined) {
      this.selectedNode.node.parent.children.push(copy);
    } else {
      this.projectService.nodes.push(copy);
    }
    this.refreshTree();
  }

  bulkDelete(): void {
    this.dialog.open(ConfirmDeletionDialog, {
      data: {
        text: `${this.selection.selected.length} items`,
        remove: false
      }
    }).afterClosed().subscribe(result => {
      if(result) {
        for(const node of this.selection.selected) {
          this.selectedNode = node;
          this.deleteNode(true);
        }
      }
    });
  }

  bulkDuplicate(): void {
    for(const node of this.selection.selected) {
      this.selectedNode = node;
      this.duplicate();
    }
  }

  rename(): void {
    this.dialog.open(RenameDialog, {
      data: {
        name: this.selectedNode.node.name
      }
    }).afterClosed().subscribe(result => {
      this.selectedNode.node.name = result;
    });
  }

  selectHierarchy(node: Node): void {
    for(const child of node.children) {
      this.selection.select(this.flatNodeMap.get(child));
      this.selectHierarchy(child);
    }
  }

  deselectHierarchy(node: Node): void {
    for(const child of node.children) {
      this.selection.deselect(this.flatNodeMap.get(child));
      this.deselectHierarchy(child);
    }
  }

  select(node: FlatNode): void {
    if(!this.multiSelection) {
      const wasSelected: boolean = this.selection.isSelected(node);
      this.selection.clear();
      if(!wasSelected) {
        this.selection.select(node);
      }
    } else {
      this.selection.toggle(node);
      if(this.recursiveSelection) {
        if(this.selection.isSelected(node)) {
          this.selectHierarchy(node.node);
        } else {
          this.deselectHierarchy(node.node);
        }

        let parent: FlatNode | undefined = this.flatNodeMap.get(node.node.parent);
        while(parent !== undefined) {
          const nodeSelected: boolean = this.selection.isSelected(parent);
          const descendants: FlatNode[] = this.treeControl.getDescendants(parent);
          const descendantsAllSelected: boolean = descendants.length > 0 && descendants.every(child => this.selection.isSelected(child));
          if (nodeSelected && !descendantsAllSelected) {
            this.selection.deselect(parent);
          } else if (!nodeSelected && descendantsAllSelected) {
            this.selection.select(parent);
          }
          parent = this.flatNodeMap.get(parent.node.parent);
        }
      }
    }
    if(this.selection.selected.length === 1) {
      this.projectService.currentNode = this.selection.selected[0].node;
    } else {
      this.projectService.currentNode = undefined;
    }
  }

  nodeContextMenu(event: MouseEvent, node: FlatNode): void {
    event.preventDefault();
    this.selectedNode = node;
    this.nodeMenuPosition.x = `${event.clientX}px`;
    this.nodeMenuPosition.y = `${event.clientY}px`;
    this.nodeMenuTrigger.openMenu();
  }

  getIcon(type: NodeType): string {
    switch(type) {
      case "pack":
        return "reorder";
      case "folder":
        return "folder";
      case "vehicle":
        return "local_shipping";
      case "part":
        return "select_all";
      case "instrument":
        return "speed";
      case "decor":
        return "grass";
      case "booklet":
        return "import_contacts";
      case "skin":
        return "brush";
      default:
        return "help_center";
    }
  }
  
  ngOnInit(): void {
    this.refreshTree();
  }

  refreshTree(): void {
    this.dataSource.data = this.projectService.nodes;
  }

  saveProject(): void {
    this.projectService.save();
  }

  renameProject(): void {
    this.dialog.open(RenameDialog, {
      data: {
        name: this.projectService.name
      }
    }).afterClosed().subscribe(result => {
      const recentProject: RecentProject | undefined = this.projectService.recentProjects.find(recent => recent.path === this.projectService.path);
      if(recentProject !== undefined) {
        recentProject.name = result;
      }
      this.title.setTitle(`MTS Pack Studio - ${result}`);
      this.projectService.name = result;
    });
  }

  closeProject(): void {
    this.projectService.save();
    this.projectService.currentNode = undefined;
    this.projectService.name = undefined;
    this.selection.clear();
    this.title.setTitle("MTS Pack Studio");
    this.router.navigate(["/start"]);
  }

  getProjectName(): string {
    return this.projectService.name;
  }
}

export interface ConfirmDeletionDialogData {
  text: string;
  remove: boolean;
}
export interface RenameDialogData {
  name: string;
}

@Component({
  selector: 'confirmdeletion-dialog',
  templateUrl: './confirmdeletion-dialog.html'
})
export class ConfirmDeletionDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmDeletionDialog>, @Inject(MAT_DIALOG_DATA) public data: ConfirmDeletionDialogData) {}
}

@Component({
  selector: 'rename-dialog',
  templateUrl: './rename-dialog.html',
  styleUrls: ['./rename-dialog.scss']
})
export class RenameDialog {
  newName: string;

  constructor(public dialogRef: MatDialogRef<RenameDialog>, @Inject(MAT_DIALOG_DATA) public data: RenameDialogData) {
    this.newName = this.data.name;
  }
}