'use client'

import dynamic from 'next/dynamic'

// Import the CommandBridge component with dynamic loading and SSR disabled
// This is necessary because Three.js requires the window object
const CommandBridge = dynamic(
  () => import('../components/3d/CommandBridge'),
  { ssr: false }
)

// Import the SystemMonitor component
const SystemMonitor = dynamic(
  () => import('../components/ui/SystemMonitor'),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#050520]">
      <CommandBridge />
      <SystemMonitor />
    </div>
  )
}
