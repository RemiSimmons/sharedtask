"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

interface ChartsProps {
  analytics: any
  stats: any
}

export default function AdminCharts({ analytics, stats }: ChartsProps) {
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  // Mock data for charts (replace with real data)
  const userGrowthData = analytics?.userGrowth || [
    { month: 'Jan', users: 400 },
    { month: 'Feb', users: 300 },
    { month: 'Mar', users: 500 },
    { month: 'Apr', users: 280 },
    { month: 'May', users: 590 },
    { month: 'Jun', users: 320 },
  ]

  const taskStatusData = [
    { name: 'Available', value: stats?.tasks?.available || 0 },
    { name: 'Claimed', value: stats?.tasks?.claimed || 0 },
    { name: 'Completed', value: stats?.tasks?.completed || 0 },
  ]

  const projectActivityData = analytics?.projectActivity || [
    { date: '2024-01', projects: 12 },
    { date: '2024-02', projects: 19 },
    { date: '2024-03', projects: 15 },
    { date: '2024-04', projects: 25 },
    { date: '2024-05', projects: 22 },
    { date: '2024-06', projects: 30 },
  ]

  return (
    <div className="space-y-8">
      {/* User Growth Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Task Status Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={taskStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {taskStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Project Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Project Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="projects" stroke="#82ca9d" fill="#82ca9d" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}



