import { useState } from 'react';
import { Download, Lock, Search, Clock } from 'lucide-react';

const lists = [
  { name: 'ecp_export_20250324.csv', date: 'Mar 24, 2025, 05:44 AM', progress: 42, emails: 753 },
  { name: 'leads-import.csv', date: 'Mar 23, 2025, 02:11 PM', progress: 17, emails: 998 },
  { name: 'chicago.xlsx', date: 'Feb 17, 2025, 06:49 PM', progress: 38, emails: 295 },
  { name: 'oklahomaaaaaaa.xlsx', date: 'Jan 13, 2025, 04:09 PM', progress: 27, emails: 241 },
];

export default function RecentListsPage() {
  const [search, setSearch] = useState('');
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Recent Lists</h1>
      <div className="flex items-center mb-8">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search lists"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase())).map(list => (
          <div key={list.name} className="bg-white rounded-xl border border-border shadow p-6 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-500">{list.date}</span>
            </div>
            <div className="font-semibold text-gray-900 truncate mb-2">{list.name}</div>
            <div className="flex items-center mb-2">
              <div className="w-full h-2 bg-muted rounded-full mr-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${list.progress}%` }}></div>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{list.progress}%</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{list.emails} Emails</span>
              <button className="btn-secondary flex items-center text-sm"><Download className="w-4 h-4 mr-1" /> Download</button>
            </div>
          </div>
        ))}
        {/* Cartes verrouillées */}
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-muted rounded-xl border border-border shadow p-6 flex flex-col items-center justify-center min-h-[160px] opacity-60">
            <Lock className="w-8 h-8 text-gray-300 mb-2" />
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-8">
        <span className="text-sm text-gray-500">Showing 1 to 4 of 4 results</span>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary px-2 py-1" disabled>{'<'}</button>
          <span className="text-sm text-gray-700">Page 1 of 1</span>
          <button className="btn-secondary px-2 py-1" disabled>{'>'}</button>
        </div>
      </div>
    </div>
  );
} 