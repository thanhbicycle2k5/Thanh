import * as React from 'react';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-auto px-4 py-3 rounded-xl shadow-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-blue-500 shrink-0" />
        <div className="flex-1 text-zinc-700 dark:text-zinc-300">Cần tải lại trang để cập nhật</div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors text-xs"
        >
          Tải lại
        </button>
      </div>
    </div>
  );
}
