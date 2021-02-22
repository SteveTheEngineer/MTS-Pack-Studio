import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LoadResult, ProjectService, RecentProject } from '../project.service';
const FileSystem = window["nodeRequire"]("fs");
const Path = window["nodeRequire"]("path");
const OperatingSystem = window["nodeRequire"]("os");
const Electron = window["nodeRequire"]("electron");

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  constructor(private dialog: MatDialog, private router: Router, private projectService: ProjectService, private title: Title) { }

  ngOnInit(): void {
  }

  getRecentProjects(): RecentProject[] {
    return this.projectService.getRecentProjects();
  }

  removeRecentProject(recentProject: RecentProject): void {
    this.projectService.recentProjects.splice(this.projectService.recentProjects.indexOf(recentProject), 1);
  }

  newProject(): void {
    this.dialog.open(NewProjectDialog);
  }

  openProject(path: string | undefined = undefined): void {
    if(path !== undefined) {
      const loadResult: LoadResult = this.projectService.load(path);
      switch(loadResult) {
        case "success":
          this.router.navigate(["/project"]);
          this.title.setTitle(`MTS Pack Studio - ${this.projectService.name}`);
          break;
        case "corrupted":
          this.dialog.open(LoadErrorDialog, {
            data: {
              message: "Could not load the project as it was corrupted"
            }
          });
          break;
        case "invalid":
          this.dialog.open(LoadErrorDialog, {
            data: {
              message: "The selected folder is not a MTS Pack Studio project"
            }
          });
          break;
        case "studio_outdated":
          this.dialog.open(LoadErrorDialog, {
            data: {
              message: "The project was made in a newer version of MTS Pack Studio. Upgrade the studio to open the project"
            }
          });
          break;
        case "upgrade_required":
          this.dialog.open(LoadErrorDialog, {
            data: {
              message: "The project was made in an older version of MTS Pack Studio and requires conversion"
            }
          });
          break;
        default:
          this.dialog.open(LoadErrorDialog, {
            data: {
              message: `Unexpected loading result: ${loadResult}`
            }
          });
          break;
      }
    } else {
      Electron.remote.dialog.showOpenDialog({ 
        properties: [
          "openDirectory"
        ]
      }).then(result => {
        if(result.filePaths.length > 0) {
          this.openProject(result.filePaths[0]);
        }
      });
    }
  }

  getLastOpenTime(recentProject: RecentProject): string {
    return new Date(recentProject.time).toLocaleString();
  }

  openRecent(recentProject: RecentProject): void {
    if(FileSystem.existsSync(recentProject.path)) {
      this.openProject(recentProject.path);
    } else {
      this.dialog.open(LoadErrorDialog, {
        data: {
          message: `The recent project you are trying to open no longer exists`
        }
      });
    }
  }
}

export interface LoadErrorDialogData {
  message: string;
}
@Component({
  selector: "loaderror-dialog",
  templateUrl: "./loaderror-dialog.html"
})
export class LoadErrorDialog {
  constructor(private dialogRef: MatDialogRef<LoadErrorDialog>, @Inject(MAT_DIALOG_DATA) public data: LoadErrorDialogData) {}
}

@Component({
  selector: 'newproject-dialog',
  templateUrl: './newproject-dialog.html',
  styleUrls: ["./newproject-dialog.scss"]
})
export class NewProjectDialog {
  projectName: string = "New Project";
  projectPath: string = "";
  error: string = "";

  constructor(private dialogRef: MatDialogRef<NewProjectDialog>, private projectService: ProjectService, private router: Router, private title: Title) {}

  getPath(): string {
    return this.projectPath || Path.resolve(OperatingSystem.homedir(), "MTSStudioProjects", this.projectName);
  }

  create(): void {
    if(!FileSystem.existsSync(this.getPath())) {
      try {
        FileSystem.mkdirSync(this.getPath(), {
          recursive: true
        });
        FileSystem.mkdirSync(Path.resolve(this.getPath(), "assets"));
        FileSystem.writeFileSync(Path.resolve(this.getPath(), "mts_studio_project.json"), JSON.stringify({
          name: this.projectName,
          format: 0
        }));
        FileSystem.writeFileSync(Path.resolve(this.getPath(), "nodes.json"), JSON.stringify([]));
        this.projectService.currentNode = undefined;
        this.projectService.path = this.getPath();
        this.projectService.nodes = [];
        this.projectService.addRecentProject({
          name: this.projectName,
          path: this.getPath(),
          time: Date.now()
        });
        this.projectService.saveRecentProjects();
        this.projectService.name = this.projectName;
        this.router.navigate(["project"], {
          state: {
            path: this.getPath()
          }
        });
        this.title.setTitle(`MTS Pack Studio - ${this.projectName}`);
        this.dialogRef.close();
      } catch(e) {
        this.error = "An unexpected error has occured";
      }
    } else {
      this.error = "The project already exists";
    }
  }
}
