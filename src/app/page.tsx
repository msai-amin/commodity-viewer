'use client';

import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface CommodityData {
  d: string;
  'W.BCPI': { v: string };
  'W.BCNE': { v: string };
  'W.ENER': { v: string };
  'W.MTLS': { v: string };
  'W.FOPR': { v: string };
  'W.AGRI': { v: string };
  'W.FISH': { v: string };
}

interface ProcessedData {
  date: string;
  rawDate: string;
  BCPI: number;
  BCNE: number;
  Energy: number;
  Metals: number;
  Forestry: number;
  Agriculture: number;
  Fish: number;
  BCPI_YoY?: number;
  Energy_YoY?: number;
  Metals_YoY?: number;
  Forestry_YoY?: number;
  Agriculture_YoY?: number;
  Fish_YoY?: number;
}

interface IndexConfig {
  key: keyof Omit<ProcessedData, 'date' | 'BCPI_YoY' | 'Energy_YoY' | 'Metals_YoY' | 'Forestry_YoY' | 'Agriculture_YoY' | 'Fish_YoY'>;
  name: string;
  color: string;
}

const INDICES: IndexConfig[] = [
  { key: 'BCPI', name: 'Total Index', color: '#8884d8' },
  { key: 'Energy', name: 'Energy', color: '#82ca9d' },
  { key: 'Metals', name: 'Metals & Minerals', color: '#ffc658' },
  { key: 'Agriculture', name: 'Agriculture', color: '#ff7300' },
  { key: 'Forestry', name: 'Forestry', color: '#00C49F' },
  { key: 'Fish', name: 'Fish', color: '#FFBB28' }
];

const calculateYoYChange = (data: CommodityData[], index: number, key: string): number | undefined => {
  if (index < 52) return undefined; // Need at least a year of data
  const getValue = (item: CommodityData): number => {
    const keyMap: Record<string, keyof CommodityData> = {
      'BCPI': 'W.BCPI',
      'Energy': 'W.ENER',
      'Metals': 'W.MTLS',
      'Forestry': 'W.FOPR',
      'Agriculture': 'W.AGRI',
      'Fish': 'W.FISH'
    };
    const mappedKey = keyMap[key] as keyof CommodityData;
    const value = item[mappedKey];
    if (typeof value === 'object' && 'v' in value) {
      return parseFloat(value.v);
    }
    return 0;
  };

  const currentValue = getValue(data[index]);
  const lastYearValue = getValue(data[index - 52]);
  
  if (isNaN(currentValue) || isNaN(lastYearValue) || lastYearValue === 0) {
    return undefined;
  }
  
  return ((currentValue - lastYearValue) / lastYearValue) * 100;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-CA', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function Home() {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set(INDICES.map(i => i.key)));
  const [showYoYChanges, setShowYoYChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/BCPI_WEEKLY-sd-1972-01-01.json');
        const jsonData = await response.json();
        
        const processedData = jsonData.observations.map((obs: CommodityData, index: number, arr: CommodityData[]) => {
          const baseData = {
            date: formatDisplayDate(obs.d),
            rawDate: obs.d,
            BCPI: parseFloat(obs['W.BCPI'].v),
            BCNE: parseFloat(obs['W.BCNE'].v),
            Energy: parseFloat(obs['W.ENER'].v),
            Metals: parseFloat(obs['W.MTLS'].v),
            Forestry: parseFloat(obs['W.FOPR'].v),
            Agriculture: parseFloat(obs['W.AGRI'].v),
            Fish: parseFloat(obs['W.FISH'].v),
          };

          // Calculate year-over-year changes
          const yoyData = {
            BCPI_YoY: calculateYoYChange(arr, index, 'BCPI'),
            Energy_YoY: calculateYoYChange(arr, index, 'Energy'),
            Metals_YoY: calculateYoYChange(arr, index, 'Metals'),
            Forestry_YoY: calculateYoYChange(arr, index, 'Forestry'),
            Agriculture_YoY: calculateYoYChange(arr, index, 'Agriculture'),
            Fish_YoY: calculateYoYChange(arr, index, 'Fish'),
          };

          return {
            ...baseData,
            ...yoyData
          };
        });

        setData(processedData);
        setFilteredData(processedData);
        
        // Set initial date range using the original date format
        setStartDate(formatDate(jsonData.observations[0].d));
        setEndDate(formatDate(jsonData.observations[jsonData.observations.length - 1].d));
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const filtered = data.filter(item => {
      const date = new Date(item.rawDate);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);
      return date >= start && date <= end;
    });

    setFilteredData(filtered);
  }, [data, startDate, endDate]);

  const toggleIndex = (index: string) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const resetFilters = () => {
    setStartDate(data[0]?.date || '');
    setEndDate(data[data.length - 1]?.date || '');
    setSelectedIndices(new Set(INDICES.map(i => i.key)));
  };

  const getLatestTrends = () => {
    if (filteredData.length < 52) return null;
    const latest = filteredData[filteredData.length - 1];
    return INDICES.map(index => ({
      name: index.name,
      value: Number(latest[index.key]),
      yoy: Number(latest[`${index.key}_YoY` as keyof ProcessedData] || 0),
      color: index.color
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white p-3 border rounded shadow">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}{showYoYChanges ? '%' : ''}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
  }

  const trends = getLatestTrends();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Bank of Canada Commodity Price Index</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showYoYChanges}
                onChange={(e) => setShowYoYChanges(e.target.checked)}
                className="rounded"
              />
              <span>Show Year-over-Year Changes</span>
            </label>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors self-end"
          >
            Reset Filters
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {INDICES.map((index) => (
            <label key={index.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIndices.has(index.key)}
                onChange={() => toggleIndex(index.key)}
                className="rounded"
              />
              <span style={{ color: index.color }}>{index.name}</span>
            </label>
          ))}
        </div>

        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={Math.max(Math.floor(filteredData.length / 20), 0)}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={showYoYChanges ? { value: '% Change YoY', angle: -90, position: 'insideLeft' } : undefined}
                domain={showYoYChanges ? [-50, 50] : ['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              {INDICES.map((index) => (
                selectedIndices.has(index.key) && (
                  <Line
                    key={index.key}
                    type="monotone"
                    dataKey={showYoYChanges ? `${index.key}_YoY` : index.key}
                    stroke={index.color}
                    name={`${index.name}${showYoYChanges ? ' YoY %' : ''}`}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trends && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Latest Values & Trends</h3>
              <div className="space-y-2">
                {trends.map((trend) => (
                  <div key={trend.name} className="flex justify-between items-center">
                    <span style={{ color: trend.color }}>{trend.name}:</span>
                    <div className="text-right">
                      <div>{Number(trend.value).toFixed(2)}</div>
                      <div className={`text-sm ${Number(trend.yoy) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(trend.yoy) > 0 ? '↑' : '↓'} {Math.abs(Number(trend.yoy)).toFixed(1)}% YoY
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
