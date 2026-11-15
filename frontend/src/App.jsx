/**
 * ALTAIR — App Root
 * Routes between Destination Selector and Command Center views.
 */

import DestinationSelector from './views/DestinationSelector'
import CommandCenter from './views/CommandCenter'
import useStore from './store/useStore'

export default function App() {
  const appPhase = useStore((s) => s.appPhase)

  return (
    <div className="h-full w-full overflow-hidden bg-void">
      {appPhase === 'destination' ? <DestinationSelector /> : <CommandCenter />}
    </div>
  )
}
