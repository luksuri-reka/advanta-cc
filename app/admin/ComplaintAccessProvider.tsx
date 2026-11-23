'use client';

import { createContext, useContext } from 'react';
import type { ComplaintActor } from '@/app/utils/complaintPermissions';

const ComplaintAccessContext = createContext<ComplaintActor | null>(null);

export const ComplaintAccessProvider = ComplaintAccessContext.Provider;
export const useComplaintActor = () => useContext(ComplaintAccessContext);
