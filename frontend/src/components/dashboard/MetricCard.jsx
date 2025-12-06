import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MetricCard({ title, description, value, trend, icon }) {
  return (
    <Card className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <Badge variant={trend === 'up' ? 'success' : 'danger'}>
              {trend === 'up' ? '+' : '-'}{trend === 'up' ? '10%' : '5%'}
            </Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
