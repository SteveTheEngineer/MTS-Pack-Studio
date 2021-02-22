import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectComponent } from './project/project.component';
import { StartComponent } from './start/start.component';

const routes: Routes = [
  {path: "", pathMatch: "full", redirectTo: "/start"},
  {path: "start", component: StartComponent},
  {path: "project", component: ProjectComponent},
  {path: "project/:path", component: ProjectComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
