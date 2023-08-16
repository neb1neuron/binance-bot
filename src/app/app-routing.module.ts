import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {
  //   path: PageNameEnum.Login,
  //   loadChildren: () =>
  //     import('./pages/login/login.module').then((m) => m.AuthModule),
  // },
  // {
  //   path: '**',
  //   redirectTo: PageNameEnum.NotFound,
  //   pathMatch: 'full',
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
