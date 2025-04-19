// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { VisualizerComponent } from './pages/visualizer/visualizer.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'visualizer', loadComponent: () => import('./pages/visualizer/visualizer.component').then(m => m.VisualizerComponent) },
];
