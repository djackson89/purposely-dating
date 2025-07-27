import React from 'react';
import { BackgroundRemover } from '@/components/BackgroundRemover';

const AppIconProcessor: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <BackgroundRemover />
    </div>
  );
};

export default AppIconProcessor;