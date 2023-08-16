import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import * as moment from "moment";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexYAxis,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexTooltip
} from "ng-apexcharts";
import { ChartDataModel } from '../types/chart.data.model';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-candle-chart',
  templateUrl: './candle-chart.component.html',
  styleUrls: ['./candle-chart.component.scss']
})
export class CandleChartComponent implements OnInit, OnChanges {
  @Input() data: ChartDataModel[] = [];
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: ChartOptions;


  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "candle",
          data: this.data?.map(d => { return { x: new Date(d.date), y: [d.open, d.high, d.low, d.close] } })
        }
      ],
      chart: {
        height: 500,
        type: "candlestick",
        animations: {
          enabled: false,
          animateGradually: {
            enabled: false,
          },
          dynamicAnimation: {
            enabled: false,
          }
        }
      },
      title: {
        text: "CandleStick Chart - Category X-axis",
        align: "left"
      },
      tooltip: {
        enabled: true,
        theme: 'dark'
      },
      xaxis: {
        type: "category",
        labels: {
          formatter: function (val) {
            return moment(val).format("MMM DD HH:mm");
          }
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        }
      }
    };
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['data']?.currentValue?.length) {
      // console.log(this.data);
      this.createOptions();
    }
  }


  createOptions() {
    this.chartOptions.series = [{ data: [...this.data?.map(d => { return { x: new Date(d.date), y: [d.open, d.high, d.low, d.close] } })] }];
  }
}
