import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';

export function RootLayout() {
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
