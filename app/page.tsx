'use client';

import { useState } from 'react';
import AllTasksView from '@/components/AllTasksView';
import AddTaskFAB from '@/components/AddTaskFAB';

export default function Home() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-[#111111]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="mx-auto max-w-lg px-5 pt-12 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 mb-1">My Day</p>
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">{today}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg px-5 pb-40 pt-6">
        <AllTasksView />
      </div>

      {/* FAB — always mounted so the sheet stays alive when open */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <AddTaskFAB onOpenChange={setSheetOpen} />
      </div>
    </main>
  );
}
