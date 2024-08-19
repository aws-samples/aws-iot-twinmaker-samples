import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App } from '@iot-prototype-kit/components/App';
import LoginPage from './loginPage';
import ConfirmUserPage from './confirmUserPage';
import styles from './styles.module.css';
import { $appConfig } from '@iot-prototype-kit/stores/config';
import type { AppConfig } from '@iot-prototype-kit/types';
import { useStore } from '@iot-prototype-kit/core/store';
import { $user } from '@iot-prototype-kit/stores/user';

interface RouterProps {
  config: AppConfig;
}

const Router = ({ config }: RouterProps) => {
  const user = useStore($user);

  const isAuthenticated = () => !!user;

  useEffect(() => {
    $appConfig.set(config);
    
  }, [config, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />
        <Route path="/home" element={isAuthenticated() ? <App className={styles.app} /> : <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
