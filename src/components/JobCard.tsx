import React from 'react';
import { Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User, 
  Phone, 
  Laptop, 
  IndianRupee, 
  Edit, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onComplete: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onEdit, onComplete }) => {
  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'Pending': return <Clock className="h-3 w-3" />;
      case 'In Progress': return <AlertCircle className="h-3 w-3" />;
      case 'Completed': return <CheckCircle className="h-3 w-3" />;
      case 'Delivered': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-[#0047AB]">
              {job.jobSheetNumber}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{job.customerName}</p>
          </div>
          <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
            {getStatusIcon(job.status)}
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Device Info */}
        <div className="flex items-center gap-2 text-sm">
          <Laptop className="h-4 w-4 text-gray-500" />
          <span>{job.deviceType} - {job.brandName}</span>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{job.contactNumber}</span>
        </div>

        {/* Engineer */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span>{job.attendedBy}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
        </div>

        {/* Cost */}
        <div className="flex items-center gap-2 text-sm">
          <IndianRupee className="h-4 w-4 text-gray-500" />
          <span>
            Estimated: ₹{job.estimatedCost}
            {job.finalCost && (
              <span className="ml-2 font-medium">Final: ₹{job.finalCost}</span>
            )}
          </span>
        </div>

        {/* Issues */}
        <div className="text-sm">
          <p className="font-medium text-gray-700 mb-1">Issues:</p>
          <ul className="text-gray-600 space-y-1">
            {job.issues.slice(0, 2).map((issue, index) => (
              <li key={index} className="text-xs">• {issue}</li>
            ))}
            {job.issues.length > 2 && (
              <li className="text-xs text-gray-500">
                +{job.issues.length - 2} more issues
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(job)}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          
          {job.status !== 'Completed' && job.status !== 'Delivered' && (
            <Button
              size="sm"
              onClick={() => onComplete(job)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;