"use client";
import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

const AlertTimer = ({ endTime, colorClass, onExpire, noteId }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [hasExpired, setHasExpired] = useState(false); // Add this state

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) {
        if (onExpire && noteId) {
          setHasExpired(true);
          onExpire(noteId);
        }
        return 'Expired';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(interval);
  }, [endTime, onExpire, noteId, hasExpired]);

  if (!endTime) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colorClass} text-xs font-medium shadow-sm`}>
      <Clock size={12} />
      <span>{timeLeft}</span>
    </div>
  );
};

const AlertCard = ({ note, index, onExpire }) => {
  const getAlertConfig = (critical) => {
    switch (critical) {
      case 4:
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/50',
          textColor: 'text-red-900 dark:text-red-100',
          descColor: 'text-red-700 dark:text-red-300',
          timerBg: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
        };
      case 3:
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800',
          icon: AlertTriangle,
          iconColor: 'text-orange-600 dark:text-orange-400',
          iconBg: 'bg-orange-100 dark:bg-orange-900/50',
          textColor: 'text-orange-900 dark:text-orange-100',
          descColor: 'text-orange-700 dark:text-orange-300',
          timerBg: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
        };
      case 2:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: Info,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          descColor: 'text-yellow-700 dark:text-yellow-300',
          timerBg: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
        };
      case 1:
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800',
          icon: Bell,
          iconColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/50',
          textColor: 'text-green-900 dark:text-green-100',
          descColor: 'text-green-700 dark:text-green-300',
          timerBg: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          icon: Info,
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/50',
          textColor: 'text-blue-900 dark:text-blue-100',
          descColor: 'text-blue-700 dark:text-blue-300',
          timerBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        };
    }
  };

  const config = getAlertConfig(note?.critical_value);
  const Icon = config.icon;

  return (
    <div
      className={`group relative w-full rounded-xl border ${config.border} ${config.bg} p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5`}
    >
      <div className="relative flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${config.iconBg} shrink-0 mt-0.5`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="font-semibold text-base text-gray-900 dark:text-gray-100">
              {note?.alert_title || "Untitled Notification"}
            </div>
            <AlertTimer
              endTime={note?.end_time}
              colorClass={config.timerBg}
              onExpire={onExpire}
              noteId={note?.uid || note?._metadata?.uid}
            />
          </div>
          {note?.alert_description && (
            <div
              className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 prose prose-sm max-w-none [&_a]:underline max-h-32 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.alert_description) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { AlertTimer, AlertCard };