import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  getYears() {
    return this.http.get<number[]>(`${this.baseUrl}/years`);
  }

  getStrikes(year: number) {
    return this.http.get<any[]>(`${this.baseUrl}/strikes?year=${year}`);
  }

  getData(strike: number, expiryDate: string, optionType: string) {
    return this.http.get<any[]>(`${this.baseUrl}/data?strike=${strike}&expiryDate=${expiryDate}&optionType=${optionType}`);
  }
}
