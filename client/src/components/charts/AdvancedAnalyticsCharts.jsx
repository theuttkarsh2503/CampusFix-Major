import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import Card from "../ui/Card"

const COLORS = ["#2563EB", "#14B8A6", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#84CC16"]

const ChartCard = ({ title, children }) => (
  <Card>
    <h3 className="mb-4 font-heading text-lg font-semibold text-brand-text">{title}</h3>
    <div className="h-72">{children}</div>
  </Card>
)

const EmptyChart = () => <div className="flex h-full items-center justify-center text-sm text-brand-muted">No data for these filters.</div>

const PieBreakdown = ({ title, data }) => (
  <ChartCard title={title}>
    {data?.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={92} label>
            {data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    ) : <EmptyChart />}
  </ChartCard>
)

const BarBreakdown = ({ title, data }) => (
  <ChartCard title={title}>
    {data?.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" angle={-25} textAnchor="end" height={55} interval={0} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#14B8A6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : <EmptyChart />}
  </ChartCard>
)

const AdvancedAnalyticsCharts = ({ data }) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
    <BarBreakdown title="Complaints by Department" data={data?.departmentBreakdown} />
    <PieBreakdown title="Priority Distribution" data={data?.priorityBreakdown} />
    <BarBreakdown title="Complaint Locations" data={data?.locationBreakdown} />
    <PieBreakdown title="SLA Breaches" data={data?.slaBreakdown} />
    <BarBreakdown title="Student Satisfaction" data={data?.satisfactionBreakdown} />
    <ChartCard title="Average Resolution Time">
      {data?.resolutionTimeSeries?.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.resolutionTimeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" />
            <YAxis unit="h" />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}h`, "Average"]} />
            <Line type="monotone" dataKey="averageHours" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartCard>
  </div>
)

export default AdvancedAnalyticsCharts
