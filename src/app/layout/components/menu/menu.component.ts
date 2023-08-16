import { Component } from '@angular/core';
import { PermissionsService } from 'src/app/shared/services/permissions/permissions.service';
import { IPage } from './core/interfaces/page';
import { PAGES } from './core/menu.config';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {

  public pages: IPage[] = PAGES;
  public canAccess;


  constructor(
    private permissionsService: PermissionsService
  ) {
    this.canAccess = this.permissionsService.hasPermission;
  }
}
