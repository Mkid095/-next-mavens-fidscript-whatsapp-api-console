export interface BarData {
  week: string;
  value: number;
  active: boolean;
}

export interface ClientData {
  country: string;
  flag: string;
  factories: string;
  recycledText: string;
  isHigh: boolean;
  sparkline: number[];
  type: string;
  totalValue: string;
  color: string;
}

export interface MapNode {
  name: string;
  x: string;
  y: string;
  value: string;
  status: string;
  color: string;
}

export const cciBars: BarData[] = [
  { week: 'W1', value: 45, active: false },
  { week: 'W2', value: 52, active: false },
  { week: 'W3', value: 48, active: false },
  { week: 'W4', value: 58, active: false },
  { week: 'W5', value: 66, active: false },
  { week: 'W6', value: 74, active: false },
  { week: 'W7', value: 60, active: false },
  { week: 'W8', value: 85.4, active: true },
  { week: 'W9', value: 70, active: false },
  { week: 'W10', value: 65, active: false },
  { week: 'W11', value: 78, active: false },
  { week: 'W12', value: 73, active: false },
  { week: 'W13', value: 66, active: false },
  { week: 'W14', value: 55, active: false },
  { week: 'W15', value: 62, active: false },
];

export const regionRecyclingData: ClientData[] = [
  {
    country: 'Safaricom PLC',
    flag: 'healthy',
    factories: '42 instances',
    recycledText: '99.98%',
    isHigh: true,
    sparkline: [80, 95, 92, 98, 99, 99.9, 99.98],
    type: 'Daraja B2C Direct',
    totalValue: '8,412,987 dispatches',
    color: '#10b981',
  },
  {
    country: 'Equity Bank Kenya',
    flag: 'warning',
    factories: '28 instances',
    recycledText: '99.95%',
    isHigh: true,
    sparkline: [90, 93, 95, 94, 98, 97, 99.95],
    type: 'One-Time OTP',
    totalValue: '5,912,410 dispatches',
    color: '#059669',
  },
  {
    country: 'Carrefour Kenya',
    flag: 'neutral',
    factories: '14 instances',
    recycledText: '99.20%',
    isHigh: true,
    sparkline: [70, 80, 85, 80, 88, 90, 99.20],
    type: 'Loyalty Promo',
    totalValue: '2,014,350 dispatches',
    color: '#059669',
  },
  {
    country: 'KCB Bank Limited',
    flag: 'pending',
    factories: '35 instances',
    recycledText: '98.50%',
    isHigh: false,
    sparkline: [60, 70, 75, 70, 85, 82, 98.50],
    type: 'Statements Core',
    totalValue: '4,419,005 dispatches',
    color: '#eab308',
  },
];

export const mapNodes: MapNode[] = [
  { name: 'Nairobi HQ', x: '58%', y: '42%', value: '99.98%', status: 'Safaricom Core', color: 'bg-emerald-500' },
  { name: 'Mombasa Port', x: '35%', y: '45%', value: '98.40%', status: 'Coastal Node', color: 'bg-teal-500' },
  { name: 'Kisumu Hub', x: '22%', y: '58%', value: '97.60%', status: 'Lake Victoria Relay', color: 'bg-emerald-400' },
  { name: 'Nakuru Central', x: '47%', y: '38%', value: '99.10%', status: 'Rift Valley Node', color: 'bg-emerald-500' },
];
