import { SchedulerProvider } from '@/context/SchedulerContext'
import { HomePage } from '@/pages/HomePage'

function App() {
  return (
    <SchedulerProvider>
      <HomePage />
    </SchedulerProvider>
  )
}

export default App
