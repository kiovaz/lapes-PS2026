import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatWidget from '../ChatWidget';

export default function StoreLayout() {
  return (
    <div className="store-layout">
      <Header />
      <main className="store-content">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
