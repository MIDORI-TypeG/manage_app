import React from 'react';
import { Notice } from '../types';
import { format } from 'date-fns';

const priorityStyles = {
  high: 'border-l-4 border-red-500',
  normal: 'border-l-4 border-blue-500',
  low: 'border-l-4 border-gray-400',
};

interface AnnouncementsListProps {
  notices: Notice[];
  title?: string;
}

const AnnouncementsList: React.FC<AnnouncementsListProps> = ({ notices, title = "お知らせ" }) => {
  if (notices.length === 0) {
    return null; // Don't render anything if there are no notices
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">{title}</h2>
      <div className="space-y-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`p-3 rounded-lg shadow-sm transition-all ${priorityStyles[notice.priority]} ${notice.is_read ? 'bg-gray-100 opacity-80' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-lg font-bold ${notice.is_read ? 'text-gray-600' : 'text-gray-800'}`}>{notice.title}</h3>
                <p className={`text-xs mt-1 ${notice.is_read ? 'text-gray-500' : 'text-gray-600'}`}>
                  {format(new Date(notice.created_at), 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
            </div>
            <p className={`mt-2 text-sm ${notice.is_read ? 'text-gray-600' : 'text-gray-700'}`}>{notice.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsList;
