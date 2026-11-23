'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ComplaintActor } from '@/app/utils/complaintPermissions';

const ComplaintAccessContext = createContext<ComplaintActor | null>(null);

export function ComplaintAccessProvider({ value, children }: {
  value: ComplaintActor | null;
  children: ReactNode;
}) {
  return (
    <ComplaintAccessContext.Provider value={value}>
      {children}
    </ComplaintAccessContext.Provider>
  );
}

export const useComplaintActor = () => useContext(ComplaintAccessContext);
