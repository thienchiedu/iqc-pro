import { useQuery } from "@tanstack/react-query"
import { CACHE_TIMES } from "@/lib/caching-policies"

export interface Test {
  test_id: string
  test_name: string
  unit: string
  is_active: boolean
  reference_range_low?: number
  reference_range_high?: number
  critical_low?: number
  critical_high?: number
  notes?: string
}

export interface Device {
  device_id: string
  device_name: string
  serial_number: string
  manufacturer?: string
  model?: string
  installation_date?: string
  last_maintenance?: string
  is_active: boolean
  notes?: string
}

export interface QCLot {
  lot_id: string
  test_id: string
  level: string
  lot_number: string
  expiry_date: string
  mean_mfg?: number
  sd_mfg?: number
  manufacturer?: string
  product_name?: string
  is_active: boolean
  notes?: string
}

// Fetch functions
const fetchTests = async (): Promise<Test[]> => {
  const response = await fetch("/api/config/tests")
  if (!response.ok) {
    throw new Error("Failed to fetch tests")
  }
  const data = await response.json()
  return data.tests || []
}

const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch("/api/config/devices")
  if (!response.ok) {
    throw new Error("Failed to fetch devices")
  }
  const data = await response.json()
  return data.devices || []
}

const fetchQCLots = async (): Promise<QCLot[]> => {
  const response = await fetch("/api/config/qc-lots")
  if (!response.ok) {
    throw new Error("Failed to fetch QC lots")
  }
  const data = await response.json()
  return data.qc_lots || []
}

// Hooks
export const useTests = () => {
  return useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
    staleTime: CACHE_TIMES.QC_LIMITS, // 24 hours - master data doesn't change often
    gcTime: CACHE_TIMES.QC_LIMITS,
  })
}

export const useDevices = () => {
  return useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
    staleTime: CACHE_TIMES.QC_LIMITS, // 24 hours
    gcTime: CACHE_TIMES.QC_LIMITS,
  })
}

export const useQCLots = () => {
  return useQuery({
    queryKey: ["qc_lots"],
    queryFn: fetchQCLots,
    staleTime: CACHE_TIMES.QC_LIMITS, // 24 hours
    gcTime: CACHE_TIMES.QC_LIMITS,
  })
}

// Filtered hooks
export const useActiveTests = () => {
  const { data: tests, ...rest } = useTests()
  return {
    data: tests?.filter(test => test.is_active) || [],
    ...rest
  }
}

export const useActiveDevices = () => {
  const { data: devices, ...rest } = useDevices()
  return {
    data: devices?.filter(device => device.is_active) || [],
    ...rest
  }
}

export const useActiveQCLots = () => {
  const { data: qcLots, ...rest } = useQCLots()
  return {
    data: qcLots?.filter(lot => lot.is_active) || [],
    ...rest
  }
}

// Utility hooks
export const useQCLotsByTest = (testId?: string) => {
  const { data: qcLots, ...rest } = useActiveQCLots()
  return {
    data: testId ? qcLots.filter(lot => lot.test_id === testId) : qcLots,
    ...rest
  }
}

export const useQCLotSearch = (searchTerm: string) => {
  const { data: qcLots, ...rest } = useActiveQCLots()
  return {
    data: qcLots.filter(lot => 
      lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.lot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    ...rest
  }
}
