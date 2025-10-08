/* // src/components/Flow/FlowWrapper.tsx
import React, { Suspense } from 'react';
import { LoadingState } from '../../components/LoadingState/loading-state';
import { Flow } from '../Flow/Flow';


const Flow = React.lazy(() => import('../Flow/Flow'));

export const FlowWrapper: React.FC = () => {
  return (
    <Suspense fallback={<LoadingState message="Загрузка схемы..." />}>
      <Flow />
    </Suspense>
  );
}; */