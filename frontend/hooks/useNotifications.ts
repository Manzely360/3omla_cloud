"use client";

import { useState, useCallback, useEffect } from 'react';
import { Notification } from '@/components/notifications/NotificationSystem';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('3omla-notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('3omla-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep only last 100 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(notification => !notification.read));
  }, []);

  // Notification creators for different types
  const notifySuccess = useCallback((title: string, message: string, action?: Notification['action']) => {
    addNotification({
      type: 'success',
      title,
      message,
      action,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message: string, action?: Notification['action']) => {
    addNotification({
      type: 'error',
      title,
      message,
      action,
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message: string, action?: Notification['action']) => {
    addNotification({
      type: 'warning',
      title,
      message,
      action,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message: string, action?: Notification['action']) => {
    addNotification({
      type: 'info',
      title,
      message,
      action,
    });
  }, [addNotification]);

  const notifyTrade = useCallback((title: string, message: string, data?: any, action?: Notification['action']) => {
    addNotification({
      type: 'trade',
      title,
      message,
      data,
      action,
    });
  }, [addNotification]);

  const notifySignal = useCallback((title: string, message: string, data?: any, action?: Notification['action']) => {
    addNotification({
      type: 'signal',
      title,
      message,
      data,
      action,
    });
  }, [addNotification]);

  // Auto-remove old notifications (older than 7 days)
  useEffect(() => {
    const interval = setInterval(() => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(notification => notification.timestamp > sevenDaysAgo)
      );
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearRead,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTrade,
    notifySignal,
  };
};

