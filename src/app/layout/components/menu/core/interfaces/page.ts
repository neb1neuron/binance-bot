export interface IPage {
  url: string;
  name: string;
  icon: {
    name: string;
  };
  tooltip: {
    text: string;
  },
  isActive: boolean;
}
