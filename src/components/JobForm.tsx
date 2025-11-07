import React, { useState } from 'react';
import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface JobFormProps {
  job?: Job;
  onSubmit: (jobData: FormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface FormData {
  customerName: string;
  contactNumber: string;
  deviceType: 'Laptop' | 'Desktop' | 'DVR' | 'NVR' | 'Server' | 'Printer' | 'Monitor';
  brandName: string;
  issues: string[];
  attendedBy: string;
  estimatedCost: number;
  finalCost: number;
  status: Job['status'];
}

const brands = [
  'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI', 'Toshiba', 'Sony', 'Samsung', 'Hikvision', 'Dahua', 'Bosch', 'CP-Plus', 'Other'
];

const commonIssues = [
  'Service',
  'Screen damage',
  'Keyboard not working',
  'Battery not charging',
  'Overheating',
  'Slow performance',
  'Blue screen error',
  'No display',
  'Hard drive failure',
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
  'No power on',
  'USB ports not working',
  'Display cable issue'
];

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
    status: job?.status || 'Pending'
  });

  const [newIssue, setNewIssue] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | number | string[] | Job['status']) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    onSubmit(formData);
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
                  <SelectItem value="DVR">DVR</SelectItem>
                  <SelectItem value="NVR">NVR</SelectItem>
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
