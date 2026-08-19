import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * React Router's `errorElement` for the whole app — whatever screen threw,
 * this renders in its place. Rather than showing a broken-page message,
 * it just bounces straight back to the home screen: nothing here is worth
 * asking the user to read or recover from, and home is always a safe,
 * working screen to land on.
 */
export default function RouteError() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/', { replace: true })
  }, [navigate])

  return null
}
