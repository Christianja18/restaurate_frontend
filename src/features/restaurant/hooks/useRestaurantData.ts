import { useEffect, useState } from 'react'
import { toErrorMessage } from '../../../shared/services/supabaseErrors'
import { fetchRestaurantData } from '../services/restaurantQueries'
import type { RestaurantData } from '../types'

type RestaurantDataState = Readonly<{
  data: RestaurantData | null
  errorMessage: string | null
  isLoading: boolean
  reload: () => void
}>

export function useRestaurantData(enabled: boolean): RestaurantDataState {
  const [data, setData] = useState<RestaurantData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isMounted = true

    fetchRestaurantData()
      .then((restaurantData) => {
        if (!isMounted) {
          return
        }

        setData(restaurantData)
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setErrorMessage(toErrorMessage(error, 'No se pudo cargar el sistema'))
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
    data,
    errorMessage,
    isLoading,
    reload: () => {
      setIsLoading(true)
      setErrorMessage(null)
      setRequestKey((current) => current + 1)
    },
  }
}
