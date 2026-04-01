import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getCalls, deleteCall } from '../services/api'

export default function useCallHistory(filters = {}) {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['calls', filters],
    queryFn:  () => getCalls(filters),
    select:   (d) => d?.calls ?? [],
  })

  const { mutate: removeCall, isPending: deleting } = useMutation({
    mutationFn: deleteCall,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call deleted')
    },
    onError: (err) => toast.error(err.message),
  })

  return {
    calls:   data ?? [],
    loading: isLoading,
    error:   isError,
    removeCall,
    deleting,
  }
}
