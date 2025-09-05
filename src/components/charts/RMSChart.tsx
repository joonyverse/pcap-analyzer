import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RMSChartProps {
  rmsValues: number[];
  title?: string;
}

export const RMSChart: React.FC<RMSChartProps> = ({ 
  rmsValues, 
  title = 'RMS Values Over Time' 
}) => {
  const data = {
    labels: rmsValues.map((_, index) => index.toString()),
    datasets: [
      {
        label: 'RMS',
        data: rmsValues,
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsla(var(--primary), 0.2)',
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 5,
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
          text: 'Packet Index',
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
          text: 'RMS Value',
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
    interaction: {
      intersect: false,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {rmsValues.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No RMS data available to display chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};