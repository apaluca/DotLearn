import { createContext, useContext, useState } from "react";

const AdminContext = createContext();

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }) {
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Function to trigger refresh in all management components
  const triggerRefresh = () => {
    setRefreshCounter((prev) => prev + 1);
  };

  const value = {
    refreshCounter,
    triggerRefresh,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
