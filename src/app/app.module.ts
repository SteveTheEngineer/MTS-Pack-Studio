import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoadErrorDialog, NewProjectDialog, StartComponent } from './start/start.component';

import { MatTreeModule } from "@angular/material/tree";
import { MatListModule } from "@angular/material/list";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatRadioModule } from "@angular/material/radio";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatIconModule } from "@angular/material/icon";
import { MatDialogModule } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSelectModule } from "@angular/material/select";

import { FormsModule } from "@angular/forms";
import { ProjectComponent } from './project/project.component';
import { ViewportComponent } from './project/viewport/viewport.component';
import { ViewportService } from './project/viewport/viewport.service';
import { ConfirmDeletionDialog, ExplorerComponent, RenameDialog } from './project/explorer/explorer.component';
import { PackComponent } from './project/editor/pack/pack.component';
import { FolderComponent } from './project/editor/folder/folder.component';
import { VehicleComponent } from './project/editor/vehicle/vehicle.component';
import { ProjectService, ConfirmExitDialog } from './project.service';
import { AddStringDialog, GeneralComponent } from './project/editor/vehicle/general/general.component';
import { InstrumentHUDDialog, InstrumentsComponent } from './project/editor/vehicle/instruments/instruments.component';
import { AddCustomTypeDialog, AddTypeDialog, PartsComponent } from './project/editor/vehicle/parts/parts.component';
import { ModelObjectsComponent } from './project/editor/vehicle/modelobjects/modelobjects.component';
import { AnimationsComponent } from './project/editor/shared/animations/animations.component';

@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    NewProjectDialog,
    ProjectComponent,
    ViewportComponent,
    ExplorerComponent,
    ConfirmDeletionDialog,
    PackComponent,
    FolderComponent,
    RenameDialog,
    VehicleComponent,
    LoadErrorDialog,
    ConfirmExitDialog,
    InstrumentHUDDialog,
    GeneralComponent,
    InstrumentsComponent,
    PartsComponent,
    ModelObjectsComponent,
    AddCustomTypeDialog,
    AddTypeDialog,
    AnimationsComponent,
    AddStringDialog
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatTreeModule,
    MatListModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatTooltipModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTabsModule,
    MatSelectModule
  ],
  providers: [
    ViewportService,
    ProjectService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
