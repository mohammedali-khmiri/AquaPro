import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SwimmersComponent } from './pages/swimmers/swimmers.component';
import { CoachesComponent } from './pages/coaches/coaches.component';
import { CompetitionsComponent } from './pages/competitions/competitions.component';
import { PoolsComponent } from './pages/pools/pools.component';
import { SessionsComponent } from './pages/sessions/sessions.component';
import { ChatComponent } from './pages/chat/chat.component';
import { PoolMapComponent } from './pages/pool-map/pool-map.component';
import { PoolPrototypeComponent } from './pages/pool-prototype/pool-prototype.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { NewsComponent } from './pages/news/news.component';
import { IpCameraComponent } from './pages/ip-camera/ip-camera.component';
import { IotControlComponent } from './pages/iot-control/iot-control.component';
import { authGuard } from './guards/auth.guard';
import { LiveDashboardComponent } from './pages/live-dashboard/live-dashboard.component';
import { VerifiedSuccessComponent } from './pages/verified-success/verified-success.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Public — accessible without login (visitor mode)
  { path: 'news', component: NewsComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'pool-map', component: PoolMapComponent },
  { path: 'pool-prototype', component: PoolPrototypeComponent },
  { path: 'ip-camera', component: IpCameraComponent },
  { path: 'iot-control', component: IotControlComponent },
  { path: 'verified-success', component: VerifiedSuccessComponent },

  // Auth required
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'sessions', component: SessionsComponent, canActivate: [authGuard] },
  { path: 'competitions', component: CompetitionsComponent, canActivate: [authGuard] },

  // Admin + Coach only
  { path: 'swimmers', component: SwimmersComponent, canActivate: [authGuard], data: { roles: ['ADMIN', 'COACH'] } },

  // Admin only
  { path: 'coaches', component: CoachesComponent, canActivate: [authGuard], data: { roles: ['ADMIN'] } },
  { path: 'pools', component: PoolsComponent, canActivate: [authGuard], data: { roles: ['ADMIN', 'COACH', 'SWIMMER'] } },
];

