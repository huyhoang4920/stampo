import { createBrowserRouter } from 'react-router-dom'
import Home from './screens/Home'
import Capture from './screens/Capture'
import Collection from './screens/Collection'
import SendLetter from './screens/SendLetter'
import About from './screens/About'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  // Capture holds its own result screen — date, location and the two actions
  // all happen there, so there's no separate details route.
  { path: '/capture', element: <Capture /> },
  { path: '/collection', element: <Collection /> },
  { path: '/send', element: <SendLetter /> },
  { path: '/about', element: <About /> },
])
