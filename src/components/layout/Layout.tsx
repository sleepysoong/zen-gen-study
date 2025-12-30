/**
 * Layout 컴포넌트
 * 앱의 기본 레이아웃 구조를 제공합니다.
 */

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import './Layout.css';

/**
 * 메인 레이아웃 컴포넌트
 */
export function Layout() {
    return (
        <div className="layout">
            <Header />
            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
}
