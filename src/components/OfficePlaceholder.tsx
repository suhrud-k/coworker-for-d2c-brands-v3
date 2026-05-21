import React from 'react';
import { Card } from './shared/ui';

export function OfficePlaceholder({ title, detail }: { title: string; detail?: string }) {
  return (
    <Card className="py-12 text-center">
      <h3 className="text-[16px] font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-[14px] text-gray-500 max-w-md mx-auto">
        {detail ?? 'Detailed view coming in the next iteration. The office shell and navigation are ready.'}
      </p>
    </Card>
  );
}
