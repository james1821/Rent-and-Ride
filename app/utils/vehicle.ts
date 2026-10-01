import type { VehicleInfo } from '~/types'

export const VEHICLE_TYPE_LABEL: Record<string, string> = { car: 'Car', motorcycle: 'Motorcycle' }
export const TRANSMISSION_LABEL: Record<string, string> = { automatic: 'Automatic', manual: 'Manual', 'semi-automatic': 'Semi-auto' }
export const FUEL_LABEL: Record<string, string> = { gasoline: 'Gasoline', diesel: 'Diesel', hybrid: 'Hybrid', electric: 'Electric' }

export interface SpecChip { key: string; label: string; value: string; icon: string }

/** Ordered, display-ready vehicle facts. Skips anything not set. */
export function vehicleSpecChips(v?: VehicleInfo | null): SpecChip[] {
  if (!v) return []
  const chips: (SpecChip | null)[] = [
    { key: 'type', label: 'Type', value: VEHICLE_TYPE_LABEL[v.type] ?? v.type, icon: v.type === 'motorcycle' ? 'i-heroicons-bolt' : 'i-heroicons-truck' },
    v.year ? { key: 'year', label: 'Year', value: String(v.year), icon: 'i-heroicons-calendar' } : null,
    v.transmission ? { key: 'transmission', label: 'Transmission', value: TRANSMISSION_LABEL[v.transmission] ?? v.transmission, icon: 'i-heroicons-cog-6-tooth' } : null,
    v.fuelType ? { key: 'fuel', label: 'Fuel', value: FUEL_LABEL[v.fuelType] ?? v.fuelType, icon: 'i-heroicons-fire' } : null,
    v.seats ? { key: 'seats', label: 'Seats', value: String(v.seats), icon: 'i-heroicons-users' } : null,
    v.engineDisplacement ? { key: 'engine', label: 'Engine', value: `${v.engineDisplacement.toLocaleString()} cc`, icon: 'i-heroicons-cpu-chip' } : null,
    v.color ? { key: 'color', label: 'Color', value: v.color, icon: 'i-heroicons-swatch' } : null,
    v.mileage != null ? { key: 'mileage', label: 'Mileage', value: `${v.mileage.toLocaleString()} km`, icon: 'i-heroicons-map' } : null
  ]
  return chips.filter((c): c is SpecChip => c !== null)
}
