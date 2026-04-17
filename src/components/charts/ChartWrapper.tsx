// src/components/charts/ChartWrapper.tsx
'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Importação dinâmica para evitar SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
})

export { ReactECharts }