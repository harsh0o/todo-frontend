'use client'
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { CookieUtils } from '@/utils/cookie';
import TaskComponent from './TaskComponent';

const TaskManagerApp = () => {
  const [currentPage, setCurrentPage] = useState(CookieUtils.getCookie('authToken') ? 'dashboard' : 'login');

  return (
    <div className='mainDiv h-10'>
      {currentPage === 'login' && <LoginPage setCurrentPage={setCurrentPage}/>}
      {currentPage === 'register' && <RegisterPage setCurrentPage={setCurrentPage}/>}
      {currentPage === 'dashboard' && <TaskComponent setCurrentPage={setCurrentPage}/>}
    </div>
  );
};

export default TaskManagerApp;