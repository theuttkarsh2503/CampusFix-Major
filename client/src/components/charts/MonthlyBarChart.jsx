import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import Card from "../ui/Card"

const MonthlyBarChart = ({ data }) => (
  <Card>
    <h3 className="mb-4 font-heading text-lg font-semibold text-brand-text">Monthly Complaints</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
)

export default MonthlyBarChart
