import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type RaasCalculationResult } from '../../../lib/mockRobotModels';

interface CalculatorChartsProps {
  results: RaasCalculationResult;
  termMonths: string;
}

export const CalculatorCharts = memo(function CalculatorCharts({ results, termMonths }: CalculatorChartsProps) {
  // Prepare chart data using useMemo to prevent unnecessary recalculations
  const tcoData = useMemo(() => [
    { name: 'CAPEX', value: results.capex.total_cost },
    { name: 'Lease', value: results.lease.total_cost - results.lease.residual_value },
    { name: 'RaaS', value: results.raas.total_cost },
  ], [results]);

  // ROI cumulative cost data
  const roiData = useMemo(() => Array.from({ length: parseInt(termMonths) }, (_, i) => {
    const month = i + 1;
    return {
      month,
      CAPEX: results.capex.total_cost,
      Lease: results.lease.monthly_payment * month,
      RaaS: results.raas.monthly_subscription * month,
    };
  }), [results, termMonths]);

  return (
    <>
      {/* TCO Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>총 소유 비용 (TCO) 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tcoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('ko-KR') + '원'}
              />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="총 비용" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>누적 비용 추이 (ROI)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" label={{ value: '개월', position: 'insideBottomRight', offset: -5 }} />
              <YAxis />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('ko-KR') + '원'}
              />
              <Legend />
              <Line type="monotone" dataKey="CAPEX" stroke="#ef4444" strokeWidth={2} name="CAPEX" />
              <Line type="monotone" dataKey="Lease" stroke="#f59e0b" strokeWidth={2} name="Lease" />
              <Line type="monotone" dataKey="RaaS" stroke="#3b82f6" strokeWidth={2} name="RaaS" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
});
