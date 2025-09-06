import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RtcDistributionChartProps {
  rtcDistribution: Map<number, number>;
  title?: string;
}

export const RtcDistributionChart: React.FC<RtcDistributionChartProps> = ({ 
  rtcDistribution, 
  title = 'RTC ID Distribution' 
}) => {
  const sortedRtcs = Array.from(rtcDistribution.entries()).sort((a, b) => a[0] - b[0]);
  
  // Generate colors for each RTC ID
  const colors = sortedRtcs.map((_, index) => {
    const hue = (index * 137.508) % 360; // Golden angle approximation for good color distribution
    return `hsl(${hue}, 70%, 60%)`;
  });

  const data = {
    labels: sortedRtcs.map(([rtcId]) => `RTC ID ${rtcId}`),
    datasets: [
      {
        data: sortedRtcs.map(([, count]) => count),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('60%', '50%')),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: { parsed: { x: number; y: number }; dataIndex: number }) {
            const label = context.label || '';
            const value = context.parsed;
            const total = sortedRtcs.reduce((sum, [, count]) => sum + count, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} packets (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {rtcDistribution.size > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No RTC distribution data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};