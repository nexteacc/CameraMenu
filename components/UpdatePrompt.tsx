'use client';

import React from 'react';

interface UpdatePromptProps {
  open: boolean;
  onReload: () => void;
  isRefreshing?: boolean;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  open,
  onReload,
  isRefreshing = false,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900/90 px-4 py-2 shadow-lg shadow-black/40 backdrop-blur-md flex items-center gap-3">
      <span className="text-sm font-semibold tracking-wide">New version ready</span>
      <button
        onClick={onReload}
        disabled={isRefreshing}
        className="text-sm font-semibold px-3 py-1 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
};

export default UpdatePrompt;
