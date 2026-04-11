export interface ServiceItem {
  name: string;
  qty: number;
  price: number;
}

export interface Job {
  id: string;
  jobSheetNumber: string;
  customerName: string;
  contactNumber: string;

  deviceType:
    | 'Laptop'
    | 'Desktop'
    | 'DVR'
    | 'NVR'
    | 'Server'
    | 'Printer'
    | 'Monitor'
    | 'Attendance Machine'
    | 'Network Switch'
    | 'On_Site_Service';

  brandName: string;
  issues: string[];
  attendedBy: string;

  estimatedCost: number;
  finalCost?: number;

  status:
    | 'Pending'
    | 'In Progress'
    | 'Completed'
    | 'Delivered';

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  paymentMode?: "Cash" | "Online";
  paymentDate?: Date;

  // Service Type System

  serviceType?: 'Paid' | 'FOC' | 'Under Warranty' | 'AMC';

  warrantyStartDate?: string;
  warrantyEndDate?: string;

  amcStartDate?: string;
  amcEndDate?: string;

  // FUTURE MULTIPLE SERVICES (optional)

  serviceItems?: ServiceItem[];
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'Admin' | 'Technician';
}

export interface JobFilters {
  status?: Job['status'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  engineerName?: string;
  searchTerm?: string;
}