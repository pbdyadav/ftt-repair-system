import React, { useState } from 'react';
import { Job, ServiceItem } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';

interface JobFormProps {
  job?: Job;
  onSubmit: (jobData: FormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface FormData {
  customerName: string;
  contactNumber: string;
  deviceType: 'Laptop' | 'Desktop' | 'DVR' | 'NVR' | 'Server' | 'Printer' | 'Monitor' | 'Attendance Machine' | 'Network Switch';
  brandName: string;
  issues: string[];
  attendedBy: string;
  estimatedCost: number;
  finalCost: number;
  status: Job['status'];

  serviceType: 'Paid' | 'FOC' | 'Under Warranty' | 'AMC';
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  amcStartDate?: string;
  amcEndDate?: string;
  serviceItems: ServiceItem[];
}

const brands = [
  'Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Toshiba', 'Sony', 'Epson', 'Brother', 'Samsung', 'Hikvision', 'Dahua', 'Bosch', 'CP-Plus', 'D-Link', 'Netgear', 'Other'
];

const commonIssues = [
  'Service',
  'Screen damage / change',
  'Keyboard not working / change',
  'Battery not charging / change',
  'Hingesh Issue',
  'Overheating',
  'Slow Performance',
  'Blue Screen Error',
  'No Power On',
  'No Display',
  'Hard Drive Failure',
  'RAM issue',
  'Motherboard problem',
  'Power adapter issue',
  'Software installation',
  'Printer paper jam',
  'Print not clear',
  'Scanner not working',
  'Virus removal',
  'Data recovery',
  'Network issue',
  'Fan noise',
  'Monitor flickering',
  'Operating system reinstall',
  'USB ports not working',
  'Display cable issue',
  'CCTV Installation',
  'Networking'
];

const createEmptyServiceItem = (): ServiceItem => ({
  name: '',
  qty: 1,
  price: 0,
});

const normalizeServiceItems = (serviceItems: unknown): ServiceItem[] => {
  if (Array.isArray(serviceItems)) {
    return serviceItems
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        name: typeof item.name === 'string' ? item.name : '',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
      }));
  }

  if (typeof serviceItems === 'string' && serviceItems.trim()) {
    try {
      const parsed = JSON.parse(serviceItems);
      return normalizeServiceItems(parsed);
    } catch {
      return [];
    }
  }

  return [];
};

const calculateServiceTotal = (items: ServiceItem[]) =>
  items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);

const JobForm: React.FC<JobFormProps> = ({ job, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState<FormData>({
  customerName: job?.customerName || '',
  contactNumber: job?.contactNumber || '',
  deviceType: job?.deviceType || 'Laptop',
  brandName: job?.brandName || '',
  issues: job?.issues || [],
  attendedBy: job?.attendedBy || '',
  estimatedCost: job?.estimatedCost || 0,
  finalCost: job?.finalCost || 0,
  status: job?.status || 'Pending', 
  serviceType: job?.serviceType || 'Paid',
  warrantyStartDate: job?.warrantyStartDate || '',
  warrantyEndDate: job?.warrantyEndDate || '',
  amcStartDate: job?.amcStartDate || '',
  amcEndDate: job?.amcEndDate || '',
  serviceItems: normalizeServiceItems(job?.serviceItems)
});

  const [newIssue, setNewIssue] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | number | string[] | Job['status']) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceItemsChange = (items: ServiceItem[]) => {
    const total = calculateServiceTotal(items);

    setFormData((prev) => ({
      ...prev,
      serviceItems: items,
      estimatedCost: items.length > 0 ? total : prev.estimatedCost,
      finalCost: items.length > 0 ? total : prev.finalCost,
    }));
  };

  const addServiceItem = () => {
    handleServiceItemsChange([...formData.serviceItems, createEmptyServiceItem()]);
  };

  const updateServiceItem = (
    index: number,
    field: keyof ServiceItem,
    value: string | number
  ) => {
    const updatedItems = formData.serviceItems.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [field]:
              field === 'qty' || field === 'price'
                ? Math.max(0, Number(value) || 0)
                : value,
          }
        : item
    );

    handleServiceItemsChange(updatedItems);
  };

  const removeServiceItem = (index: number) => {
    handleServiceItemsChange(
      formData.serviceItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addIssue = (issue: string) => {
    if (issue.trim() && formData.issues.length < 5 && !formData.issues.includes(issue.trim())) {
      setFormData(prev => ({
        ...prev,
        issues: [...prev.issues, issue.trim()]
      }));
      setNewIssue('');
    }
  };

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedServiceItems = formData.serviceItems
      .map((item) => ({
        name: item.name.trim(),
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
      }))
      .filter((item) => item.name && item.qty > 0);

    const serviceTotal = calculateServiceTotal(cleanedServiceItems);
    const sanitizedFormData: FormData = {
      ...formData,
      warrantyStartDate:
        formData.serviceType === 'Under Warranty' && formData.warrantyStartDate
          ? formData.warrantyStartDate
          : '',
      warrantyEndDate:
        formData.serviceType === 'Under Warranty' && formData.warrantyEndDate
          ? formData.warrantyEndDate
          : '',
      amcStartDate:
        formData.serviceType === 'AMC' && formData.amcStartDate
          ? formData.amcStartDate
          : '',
      amcEndDate:
        formData.serviceType === 'AMC' && formData.amcEndDate
          ? formData.amcEndDate
          : '',
      serviceItems: cleanedServiceItems,
      estimatedCost:
        cleanedServiceItems.length > 0
          ? serviceTotal
          : formData.estimatedCost,
      finalCost:
        cleanedServiceItems.length > 0
          ? serviceTotal
          : formData.finalCost,
    };

    onSubmit(sanitizedFormData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-[#0047AB]">
          {isEditing ? `Edit Job - ${job?.jobSheetNumber}` : 'Create New Job'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number (WhatsApp) *</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Enter WhatsApp number"
                required
              />
            </div>
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type *</Label>
              <Select
                value={formData.deviceType}
                onValueChange={(value: FormData['deviceType']) => handleInputChange('deviceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laptop">Laptop</SelectItem>
                  <SelectItem value="Desktop">Desktop</SelectItem>
                  <SelectItem value="Server">Server</SelectItem>
                  <SelectItem value="Printer">Printer</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Monitor">Printer</SelectItem>
                  <SelectItem value="DVR">DVR</SelectItem>
                  <SelectItem value="NVR">NVR</SelectItem>
                  <SelectItem value="Monitor">Attendance Machine</SelectItem>
                  <SelectItem value="Monitor">Network Switch</SelectItem>
                  <SelectItem value="On_Site_Service">On Site Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Select
                value={formData.brandName}
                onValueChange={(value) => handleInputChange('brandName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Issues Section */}
          <div className="space-y-3">
            <Label>Issues (Max 5) *</Label>

            {/* Current Issues */}
            {formData.issues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.issues.map((issue, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {issue}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => removeIssue(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Issues Dropdown */}
            <div className="space-y-1">
              <Label>Select Common Issue</Label>
              <Select
                onValueChange={(value) => addIssue(value)}
                disabled={formData.issues.length >= 5}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a common issue" />
                </SelectTrigger>
                <SelectContent>
                  {commonIssues.map((issue) => (
                    <SelectItem
                      key={issue}
                      value={issue}
                      disabled={formData.issues.includes(issue)}
                    >
                      {issue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Add New Issue */}
            {formData.issues.length < 5 && (
              <div className="space-y-3">
                {/* Custom Issue Input */}
                <div className="flex gap-2">
                  <Input
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="Type custom issue"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addIssue(newIssue);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addIssue(newIssue)}
                    disabled={!newIssue.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Service Type */}

          <div className="space-y-2">
            <Label>Service Type</Label>

            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                handleInputChange('serviceType', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="FOC">FOC</SelectItem>
                <SelectItem value="Under Warranty">Under Warranty</SelectItem>
                <SelectItem value="AMC">AMC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Warranty Date Fields*/}
          {formData.serviceType === "Under Warranty" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Warranty Start Date</Label>

                <Input
                  type="date"
                  value={formData.warrantyStartDate}
                  onChange={(e) =>
                    handleInputChange(
                      'warrantyStartDate',
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Warranty End Date</Label>

                <Input
                  type="date"
                  value={formData.warrantyEndDate}
                  onChange={(e) =>
                    handleInputChange(
                      'warrantyEndDate',
                      e.target.value
                    )
                  }
                />
              </div>

            </div>
          )}
          {/*AMC Date Fields Conditional*/}
          {formData.serviceType === "AMC" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>AMC Start Date</Label>

                <Input
                  type="date"
                  value={formData.amcStartDate}
                  onChange={(e) =>
                    handleInputChange(
                      'amcStartDate',
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>AMC End Date</Label>

                <Input
                  type="date"
                  value={formData.amcEndDate}
                  onChange={(e) =>
                    handleInputChange(
                      'amcEndDate',
                      e.target.value
                    )
                  }
                />
              </div>

            </div>
          )}
          {/* Staff & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendedBy">Attended By *</Label>
              <select
                id="attendedBy"
                value={formData.attendedBy}
                onChange={(e) => handleInputChange('attendedBy', e.target.value)}
                required
                className="w-full border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Staff</option>
                <option value="Akash">Akash</option>
                <option value="Aditya">Aditya</option>
                <option value="Arbaz">Arbaz</option>
                <option value="Adnan">Adnan</option>
                <option value="Fhejan">Faizan</option>
                <option value="Israr">Israr</option>
                <option value="Praveen">Praveen</option>
                <option value="Aparna">Aparna</option>
                <option value="Nikhil">Nikhil</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Repair Cost (₹) *</Label>
              <Input
                id="estimatedCost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => handleInputChange('estimatedCost', Number(e.target.value))}
                placeholder="Enter estimated cost"
                min="0"
                required
              />
            </div>
          </div>

          {/* Edit Mode */}
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Job['status']) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalCost">Final Cost (₹)</Label>
                <Input
                  id="finalCost"
                  type="number"
                  value={formData.finalCost}
                  onChange={(e) => handleInputChange('finalCost', Number(e.target.value))}
                  placeholder="Enter final cost"
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Services / Parts</Label>
                <p className="text-sm text-gray-500">
                  Add each service with quantity and individual amount
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addServiceItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>

            {formData.serviceItems.length > 0 && (
              <div className="space-y-3">
                {formData.serviceItems.map((item, index) => {
                  const rowAmount = (Number(item.qty) || 0) * (Number(item.price) || 0);

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,2fr)_100px_140px_120px_48px]"
                    >
                      <div className="space-y-2">
                        <Label>Service / Particular</Label>
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateServiceItem(index, 'name', e.target.value)
                          }
                          placeholder="SSD Installation"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateServiceItem(index, 'qty', e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateServiceItem(index, 'price', e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input value={`₹ ${rowAmount}`} readOnly />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeServiceItem(index)}
                          aria-label={`Remove service ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
                  <p className="text-sm text-gray-500">Services Total</p>
                  <p className="text-lg font-semibold text-[#0047AB]">
                    ₹ {calculateServiceTotal(formData.serviceItems)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#0047AB] hover:bg-blue-700"
              disabled={formData.issues.length === 0}
            >
              {isEditing ? 'Update Job' : 'Create Job'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobForm;
