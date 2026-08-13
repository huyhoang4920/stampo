import { createBrowserRouter } from 'react-router-dom'
import Home from './screens/Home'
import Capture from './screens/Capture'
import StampDetails from './screens/StampDetails'
import Collection from './screens/Collection'
import SendLetter from './screens/SendLetter'
import About from './screens/About'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/capture', element: <Capture /> },
  { path: '/stamp/new', element: <StampDetails /> },
  { path: '/collection', element: <Collection /> },
  { path: '/send', element: <SendLetter /> },
  { path: '/about', element: <About /> },
])
