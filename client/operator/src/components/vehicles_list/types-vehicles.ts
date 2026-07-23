// --------------------------------------------
// ✅ Interfaces
// --------------------------------------------
export interface Vehicle {
  id: number;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  fuelType: string;
  device: {
    structuredTrackingData?: {
      locs?: {
        timestamp: number;
        lat: number;
        lng: number;
        alt: number;
      };
      status?: string;
      safety?: {
        alerts?: VehicleAlert[];
      };
    };
  };
  fuelLogs: FuelLog[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  documents: VehicleDocuments[];
  mainImage: {
    url: string;
  };
  images: [
    {
      url: string;
      description: string;
    },
  ];
}

export interface VehicleAlert {
  type: string;
  time: string;
  location: string;
  unhandled: boolean;
}

interface FuelLog {
  date: string;
  location: string;
  amount: number;
  cost: number;
}

interface Trip {
  from: string;
  to: string;
  distance: number;
  duration: number;
  date: string;
}

interface MaintenanceLog {
  date: string;
  description: string;
}

interface VehicleDocuments {
  number: string;
  expiryDate: string;
  url?: string;
  type: string;
}

export interface VehicleDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onAlertUpdate?: (vehicleId: number, updatedAlerts: VehicleAlert[]) => void;
  onFullDataFetch?: (vehicleId: number) => Vehicle | boolean | null;
}

export interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}
