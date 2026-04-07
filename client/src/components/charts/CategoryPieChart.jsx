import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import Card from "../ui/Card"

const COLORS = ["#2563EB", "#FACC15", "#22C55E", "#60A5FA", "#EF4444", "#8B5CF6"]

const CategoryPieChart = ({ data }) => (
  <Card>
    <h3 className="mb-4 font-heading text-lg font-semibold text-brand-text">Complaints by Category</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
            {data?.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </Card>
)

export default CategoryPieChart
