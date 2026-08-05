import React, { createContext, useContext, useState, useEffect } from 'react';

const InvestigationContext = createContext();

export function InvestigationProvider({ children }) {
  const [investigationId, setInvestigationIdState] = useState(() => {
    return localStorage.getItem('inv_id') || '';
  });

  const setInvestigationId = (id) => {
    if (id) {
      localStorage.setItem('inv_id', id);
      setInvestigationIdState(id);
    } else {
      localStorage.removeItem('inv_id');
      setInvestigationIdState('');
    }
  };

  return (
    <InvestigationContext.Provider value={{ investigationId, setInvestigationId }}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  return useContext(InvestigationContext);
}
