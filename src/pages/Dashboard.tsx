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
import { generateBillAndUpload } from "@/lib/billUtils";
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

const [dateRange, setDateRange] = useState({
  start: '',
  end: '',
});

const [editingJob, setEditingJob] = useState<Job | null>(null);
const [showEditDialog, setShowEditDialog] = useState(false);
  const handleDeliverJob = async (job: Job) => {
    console.log("STEP 1 — Deliver clicked");

    const paymentMode = prompt(
      "Payment Mode? Type: Cash or Online"
    );

    if (
      paymentMode !== "Cash" &&
      paymentMode !== "Online"
    ) {
      alert("Please enter Cash or Online");
      return;
    }

    const deliveredJob = await updateJobStatus(
      job.id,
      "Delivered",
      job.finalCost,
      paymentMode
    );

    if (!deliveredJob) {
      alert("Failed to update status");
      return;
    }

    try {
      console.log("STEP 2 — Generating bill");

      const billJob: Job = {
        ...job,
        ...deliveredJob,
        issues:
          Array.isArray(deliveredJob.issues) &&
          deliveredJob.issues.length > 0
            ? deliveredJob.issues
            : job.issues,
        serviceItems:
          Array.isArray(deliveredJob.serviceItems) &&
          deliveredJob.serviceItems.length > 0
            ? deliveredJob.serviceItems
            : job.serviceItems,
      };

      const billURL =
        await generateBillAndUpload(billJob);

      if (!billURL) {
        alert("Bill upload failed");
        return;
      }

      console.log("STEP 3 — Sending WhatsApp");

      const message =
        `Dear ${deliveredJob.customerName},
Your bill has been generated.

Bill No: ${deliveredJob.jobSheetNumber}

Download Bill:
${billURL}

Payment Mode: ${paymentMode}

Share your feedback:
https://g.page/r/Cb1PlUzb7PkzEAE/review

Thank you for choosing FTT Repairing Center.`;

      const phone =
        deliveredJob.contactNumber.replace(/\D/g, "");

      const whatsappURL =
        `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

      console.log("WhatsApp URL:", whatsappURL);

      window.open(
        whatsappURL,
        "_blank"
      );

    } catch (err) {
      console.error(
        "Bill generation failed:",
        err
      );

      alert(
        "Bill generation error. Check console."
      );
    }

    const refreshedJobs =
      await getStoredJobs();

    setJobs(refreshedJobs);
  };

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
    status:
      statusFilter !== 'all'
        ? statusFilter
        : undefined,

    engineerName:
      engineerFilter !== 'all'
        ? engineerFilter
        : undefined,

    searchTerm:
      searchTerm.trim() || undefined,
  };

  let filtered = filterJobs(
    jobs,
    filters as any
  );

  // DATE FILTER START
  if (dateRange.start) {
    const start = new Date(
      dateRange.start
    );

    filtered = filtered.filter(
      (job) =>
        new Date(job.createdAt) >=
        start
    );
  }

  if (dateRange.end) {
    const end = new Date(
      dateRange.end
    );

    end.setHours(23, 59, 59);

    filtered = filtered.filter(
      (job) =>
        new Date(job.createdAt) <=
        end
    );
  }
  // DATE FILTER END

  setFilteredJobs(filtered);

}, [
  jobs,
  searchTerm,
  statusFilter,
  engineerFilter,
  dateRange
]);

  // ✅ Edit existing job
  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowEditDialog(true);
  };

  // ✅ Mark job as completed
  const handleCompleteJob = async (job: Job) => {
  const finalCost = prompt(
    `Enter final repair cost for ${job.jobSheetNumber}:`,
    job.estimatedCost.toString()
  );

  if (finalCost !== null) {
    const cost = parseFloat(finalCost);

    if (!isNaN(cost) && cost >= 0) {
      const success = await updateJobStatus(
        job.id,
        'Completed',
        cost
      );

      if (success) {
        const refreshedJobs =
          await getStoredJobs();

        setJobs(refreshedJobs);
      }

    } else {
      alert(
        'Please enter a valid cost amount (0 or more).'
      );
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
        const refreshedJobs = await getStoredJobs();
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
  const exportData = jobs
    .filter((job) => job.status === "Delivered")
    .map((job) => ({
      JobNumber: job.jobSheetNumber,

      Customer: job.customerName,

      Phone: job.contactNumber || "",

      Status: job.status,

      Amount:
  job.finalCost === 0
    ? "FOC"
    : job.finalCost || 0,

      PaymentMode: job.paymentMode || "",

      PaymentDate: job.paymentDate
        ? new Date(job.paymentDate).toLocaleString()
        : "",

      DeliveredDate: job.updatedAt
        ? new Date(job.updatedAt).toLocaleString()
        : "",

      Engineer: job.attendedBy || "",

      Device: job.deviceType || "",
    }));

  const csv = Papa.unparse(exportData);

  const blob = new Blob(
    [csv],
    { type: "text/csv;charset=utf-8" }
  );

  saveAs(blob, "repair-jobs-accounts.csv");
};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Jobs Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and track all repair jobs (IMALAG Server)</p>
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

  dateRange={dateRange}
  setDateRange={setDateRange}

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
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={handleEditJob}
                  onComplete={handleCompleteJob}
                  onDeliver={handleDeliverJob}
                />
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

const FilterSection = ({
  searchTerm,
  setSearchTerm,

  statusFilter,
  setStatusFilter,

  engineerFilter,
  setEngineerFilter,

  dateRange,
  setDateRange,

  engineers
}: any) => (
  <Card>
    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5" />Filters & Search</CardTitle></CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="by name, job #, phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
              {/* Start Date */}
<div className="space-y-2">
  <label className="text-sm font-medium">
    Start Date
  </label>

  <Input
    type="date"
    value={dateRange.start}
    onChange={(e) =>
      setDateRange({
        ...dateRange,
        start: e.target.value,
      })
    }
  />
</div>

{/* End Date */}
<div className="space-y-2">
  <label className="text-sm font-medium">
    End Date
  </label>

  <Input
    type="date"
    value={dateRange.end}
    onChange={(e) =>
      setDateRange({
        ...dateRange,
        end: e.target.value,
      })
    }
  />
</div>
        </div>
    </CardContent>
  </Card>
);

export default Dashboard;
