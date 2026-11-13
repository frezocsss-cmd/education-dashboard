import { Route, Routes } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Login from '@/pages/auth/Login'
import Home from '@/pages/dashboard/Home'
import Students from '@/pages/students/Students'
import StudentDetail from '@/pages/students/StudentDetail'
import Teachers from '@/pages/teachers/Teachers'
import TeacherDetail from '@/pages/teachers/TeacherDetail'
import Employees from '@/pages/employees/Employees'
import Parents from '@/pages/parents/Parents'
import ParentDetail from '@/pages/parents/ParentDetail'
import Groups from '@/pages/groups/Groups'
import GroupDetail from '@/pages/groups/GroupDetail'
import Courses from '@/pages/courses/Courses'
import Attendance from '@/pages/attendance/Attendance'
import Payments from '@/pages/payments/Payments'
import Reports from '@/pages/reports/Reports'
import Settings from '@/pages/settings/Settings'
import NotFound from '@/pages/NotFound'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import { ROUTES } from './paths'

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.login}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/:id" element={<TeacherDetail />} />
        <Route path="employees" element={<Employees />} />
        <Route path="parents" element={<Parents />} />
        <Route path="parents/:id" element={<ParentDetail />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="courses" element={<Courses />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
