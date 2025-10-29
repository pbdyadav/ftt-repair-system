export interface Job {
  id: string;
  jobSheetNumber: string;
  customerName: string;
  contactNumber: string;
  deviceType: 'Laptop' | 'Desktop';
  brandName: string;
  issues: string[];
  attendedBy: string;
  estimatedCost: number;
  finalCost?: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
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