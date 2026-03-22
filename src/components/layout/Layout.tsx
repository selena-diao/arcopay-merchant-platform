import { NavPage } from '../../types';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
