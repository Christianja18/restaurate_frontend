import { useEffect, useState } from 'react'
import { fetchRestaurantDashboard } from '../services/restaurantDashboardService'
import type { RestaurantDashboard } from '../types'

type DashboardState = Readonly<{
  dashboard: RestaurantDashboard | null
  errorMessage: string | null
  isLoading: boolean
  reload: () => void
}>

export function useRestaurantDashboard(enabled: boolean): DashboardState {
  const [dashboard, setDashboard] = useState<RestaurantDashboard | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isMounted = true

    fetchRestaurantDashboard()
      .then((data) => {
        if (!isMounted) {
          return
        }

        setDashboard(data)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudo cargar Supabase',
        )
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [enabled, requestKey])

  return {
    dashboard,
    errorMessage,
    isLoading,
    reload: () => {
      setIsLoading(true)
      setErrorMessage(null)
      setRequestKey((current) => current + 1)
    },
  }
}
