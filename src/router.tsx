import { createBrowserRouter, Outlet } from 'react-router-dom'
import Home from './screens/Home'
import Capture from './screens/Capture'
import Collection from './screens/Collection'
import SendLetter from './screens/SendLetter'
import About from './screens/About'
import RouteError from './components/RouteError'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    // Shared by every screen below, so a crash anywhere in the app — not
    // just on first load — lands the user back on the home screen instead
    // of a blank, broken page.
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      // Capture holds its own result screen — date, location and the two
      // actions all happen there, so there's no separate details route.
      { path: 'capture', element: <Capture /> },
      { path: 'collection', element: <Collection /> },
      { path: 'send', element: <SendLetter /> },
      { path: 'about', element: <About /> },
    ],
  },
])
