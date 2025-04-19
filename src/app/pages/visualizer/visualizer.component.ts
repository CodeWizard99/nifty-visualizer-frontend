import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  Time,
  IChartApi,
  UTCTimestamp,
  LineStyle,
  ISeriesApi,
  CrosshairMode,
} from 'lightweight-charts';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css'],
})
export class VisualizerComponent implements OnInit, AfterViewInit {
  baseUrl = 'http://localhost:8000';
  years: string[] = [];
  selectedYear: string = '';
  expiries: string[] = [];
  strikeMap: { [expiry: string]: number[] } = {};
  selectedExpiry: string = '';
  strikes: number[] = [];
  selectedStrike: number = 0;
  optionType: string = 'CE';

  chart!: IChartApi;
  seriesMap: Map<string, ISeriesApi<'Candlestick' | 'Line'>> = new Map();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchYears();
  }

  ngAfterViewInit(): void {
    const container = document.getElementById('tv-chart')!;
    this.chart = createChart(container, {
      width: container.clientWidth,
      height: 500,
      layout: { background: { color: '#fff' }, textColor: '#000' },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: { timeVisible: true },
    });

    window.addEventListener('resize', () => {
      this.chart.resize(container.clientWidth, 500);
    });
  }

  fetchYears(): void {
    this.http.get<string[]>(this.baseUrl + '/years').subscribe((data) => {
      this.years = data;
    });
  }

  onYearChange(): void {
    this.http
      .get<any[]>(`${this.baseUrl}/strikes?year=${this.selectedYear}`)
      .subscribe((data) => {
        this.strikeMap = {};
        data.forEach((item) => {
          const expiry = item.FH_EXPIRY_DT;
          if (!this.strikeMap[expiry]) {
            this.strikeMap[expiry] = [];
          }
          this.strikeMap[expiry].push(item.FH_STRIKE_PRICE);
        });

        this.expiries = Object.keys(this.strikeMap).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );
      });
  }

  onExpiryChange(): void {
    this.strikes = this.strikeMap[this.selectedExpiry];
  }

  loadData(): void {
    const strike = this.selectedStrike;
    const expiry = this.selectedExpiry;
    const type = this.optionType;
    const seriesId = `${strike}-${expiry}-${type}`;

    this.http
      .get<any[]>(`${this.baseUrl}/data?strike=${strike}&expiryDate=${expiry}&optionType=${type}`)
      .subscribe((data) => {
        const candleData = data.map(item => ({
          time: Math.floor(new Date(item.FH_TIMESTAMP).getTime() / 1000) as UTCTimestamp,
          open: item.FH_OPENING_PRICE,
          high: item.FH_TRADE_HIGH_PRICE,
          low: item.FH_TRADE_LOW_PRICE,
          close: item.FH_CLOSING_PRICE,
        }));

        const vwapData = data.map(item => ({
          time: Math.floor(new Date(item.FH_TIMESTAMP).getTime() / 1000) as UTCTimestamp,
          value: item.VWAP
        }));

        // Candlestick series
        if (!this.seriesMap.has(seriesId)) {
          const candleSeries = this.chart.addSeries(CandlestickSeries, {
            upColor: '#4caf50',
            downColor: '#f44336',
            borderVisible: false,
            wickUpColor: '#4caf50',
            wickDownColor: '#f44336',
          });

          candleSeries.setData(candleData);
          this.seriesMap.set(seriesId, candleSeries);
        }

        // VWAP line
        const vwapId = `${seriesId}-vwap`;
        if (!this.seriesMap.has(vwapId)) {
          const vwapSeries = this.chart.addSeries(LineSeries, {
            color: '#2196f3',
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
          });

          vwapSeries.setData(vwapData);
          this.seriesMap.set(vwapId, vwapSeries);
        }

        this.chart.timeScale().fitContent();
      });
  }
}
