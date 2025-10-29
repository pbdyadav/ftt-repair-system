import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import JobCard from '@/components/JobCard';
import JobForm from '@/components/JobForm';
import { Job } from '@/types/job';
import { getStoredJobs, saveJob, updateJobStatus, sendWhatsAppNotification, filterJobs } from '@/lib/jobUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { 
  Search, 
  Filter, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [engineerFilter, setEngineerFilter] = useState<string>('all');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // ✅ Load jobs from Supabase on mount
  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getStoredJobs();
      setJobs(data);
      setFilteredJobs(data);
    };
    fetchJobs();
  }, []);

  // ✅ Apply filters whenever data changes
  useEffect(() => {
    const filters = {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      engineerName: engineerFilter !== 'all' ? engineerFilter : undefined,
      searchTerm: searchTerm.trim() || undefined,
    };
    const filtered = filterJobs(jobs, filters);
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, engineerFilter]);

  // ✅ Edit existing job
  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowEditDialog(true);
  };

  // ✅ Mark job as completed
  const handleCompleteJob = async (job: Job) => {
    const finalCost = prompt(`Enter final repair cost for ${job.jobSheetNumber}:`, job.estimatedCost.toString());
    
    if (finalCost !== null) {
      const cost = parseFloat(finalCost);
      if (!isNaN(cost) && cost > 0) {
        const success = await updateJobStatus(job.id, 'Completed', cost);
        if (success) {
          sendWhatsAppNotification({ ...job, finalCost: cost }, 'completed');
          const refreshedJobs = await getJobsFromSupabase();
          setJobs(refreshedJobs);
        }
      } else {
        alert('Please enter a valid cost amount.');
      }
    }
  };

  // ✅ Update job details (edit form)
  const handleUpdateJob = async (jobData: Partial<Job>) => {
    if (editingJob) {
      const updatedJob: Job = {
        ...editingJob,
        ...jobData,
        updatedAt: new Date(),
      };

      const success = await saveJob(updatedJob);

      if (success) {
        if (jobData.status === 'Completed' && editingJob.status !== 'Completed') {
          sendWhatsAppNotification(updatedJob, 'completed');
        }
        const refreshedJobs = await getJobsFromSupabase();
        setJobs(refreshedJobs);
      }

      setShowEditDialog(false);
      setEditingJob(null);
    }
  };

  // ✅ Unique engineer names for filter
  const engineers = Array.from(new Set(jobs.map(job => job.attendedBy))).sort();

  // ✅ Stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter(job => job.status === 'Pending').length,
    inProgress: jobs.filter(job => job.status === 'In Progress').length,
    completed: jobs.filter(job => job.status === 'Completed').length,
    delivered: jobs.filter(job => job.status === 'Delivered').length,
  };

  // ✅ Export to CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(jobs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "repair-jobs.csv");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Jobs Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and track all repair jobs (Synced with Supabase)</p>
          </div>
          <Button onClick={handleExportCSV}>Export CSV</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard icon={<BarChart3 className="h-5 w-5 text-[#0047AB]" />} label="Total Jobs" value={stats.total} color="text-[#0047AB]" />
          <StatCard icon={<Clock className="h-5 w-5 text-yellow-600" />} label="Pending" value={stats.pending} color="text-yellow-600" />
          <StatCard icon={<AlertCircle className="h-5 w-5 text-blue-600" />} label="In Progress" value={stats.inProgress} color="text-blue-600" />
          <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600" />} label="Completed" value={stats.completed} color="text-green-600" />
          <StatCard icon={<Users className="h-5 w-5 text-gray-600" />} label="Delivered" value={stats.delivered} color="text-gray-600" />
        </div>

        {/* Filters */}
        <FilterSection 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          engineerFilter={engineerFilter}
          setEngineerFilter={setEngineerFilter}
          engineers={engineers}
        />

        {/* Jobs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Jobs ({filteredJobs.length})</h2>
          </div>

          {filteredJobs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-500">No jobs found.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} onEdit={handleEditJob} onComplete={handleCompleteJob} />
              ))}
            </div>
          )}
        </div>

        {/* Edit Job Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
            {editingJob && (
              <JobForm
                job={editingJob}
                onSubmit={handleUpdateJob}
                onCancel={() => setShowEditDialog(false)}
                isEditing={true}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

/* Small reusable components */
const StatCard = ({ icon, label, value, color }: any) => (
  <Card>
    <CardContent className="p-4 flex items-center space-x-2">
      {icon}
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

const FilterSection = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, engineerFilter, setEngineerFilter, engineers }: any) => (
  <Card>
    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5" />Filters & Search</CardTitle></CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, job number, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Engineer */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Engineer</label>
          <Select value={engineerFilter} onValueChange={setEngineerFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engineers</SelectItem>
              {engineers.map((engineer: string) => (
                <SelectItem key={engineer} value={engineer}>{engineer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
