import { Component, OnInit } from '@angular/core';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { AuthStoreService } from 'src/app/pages/login/core/services/auth-store.service';
import { User } from 'src/app/shared/interfaces/user';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  public collapsed = true;
  public userProfile?: User;
  public fullNameInitials?: string;

  public userInitials = () => {
    this.userProfile?.fullName
      .split(' ')
      .reduce((acc, substring) => acc + substring[0], '');
  };

  constructor(
    private authStoreService: AuthStoreService,
    config: NgbDropdownConfig,

  ) {
    config.placement = 'top-start';
  }
  ngOnInit (): void {

    this.authStoreService.isAuthenticated$.subscribe(value => {
      if (value) {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          this.userProfile = JSON.parse(currentUser);
          this.fullNameInitials = this.userProfile?.fullName
            .split(' ')
            .reduce((acc, substring) => acc + substring[0], '') ?? '';
        }
      }
    });


  }

  async logout () {
    await this.authStoreService.logout();
  }
}
