import React from 'react';

interface ErrorStateProps {
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = "Ошибка при загрузке данных" 
}) => {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      flexDirection: "column" 
    }}>
      <div>{message}</div>
    </div>
  );
};