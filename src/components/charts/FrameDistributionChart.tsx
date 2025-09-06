import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FrameDistributionChartProps {
  frameStats: Map<number, number>;
  title?: string;
}

export const FrameDistributionChart: React.FC<FrameDistributionChartProps> = ({ 
  frameStats, 
  title = 'Frame ID Distribution' 
}) => {
  const sortedFrames = Array.from(frameStats.entries()).sort((a, b) => a[0] - b[0]);
  
  const data = {
    labels: sortedFrames.map(([frameId]) => `Frame ${frameId}`),
    datasets: [
      {
        label: 'Packet Count',
        data: sortedFrames.map(([, count]) => count),
        backgroundColor: 'hsla(var(--primary), 0.8)',
        borderColor: 'hsl(var(--primary))',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
        },
      },
      title: {
        display: true,
        text: title,
        color: 'hsl(var(--foreground))',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Frame ID',
          color: 'hsl(var(--muted-foreground))',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        grid: {
          color: 'hsl(var(--border))',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Packet Count',
          color: 'hsl(var(--muted-foreground))',
        },
        beginAtZero: true,
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
        grid: {
          color: 'hsl(var(--border))',
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {frameStats.size > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No frame distribution data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};