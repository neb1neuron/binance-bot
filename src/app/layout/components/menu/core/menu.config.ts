import { PageNameEnum } from 'src/app/layout/components/menu/core/enums/page-name.enum';

export const PAGES = [
  {
    url: `${PageNameEnum.Tasks}`,
    name: PageNameEnum.Tasks,
    icon: {
      name: 'task',
    },
    tooltip: {
      text: 'Your tasks'
    },
    isActive: false,
  },
  {
    url: `${PageNameEnum.TimeLog}`,
    name: PageNameEnum.TimeLog,
    icon: {
      name: 'calendar_add_on',
    },
    tooltip: {
      text: 'Log your time'
    },
    isActive: false,
  },
  {
    url: `${PageNameEnum.WorkLog}`,
    name: PageNameEnum.WorkLog,
    icon: {
      name: 'data_exploration',
    },
    tooltip: {
      text: 'All users worklog'
    },
    isActive: false,
  },
  {
    url: `${PageNameEnum.Utilities}`,
    name: PageNameEnum.Utilities,
    icon: {
      name: 'settings',
    },
    tooltip: {
      text: 'Useful things'
    },
    isActive: false,
  }
];
