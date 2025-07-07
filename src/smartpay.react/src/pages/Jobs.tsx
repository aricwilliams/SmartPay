import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  PlusIcon, 
  MapPinIcon, 
  ClockIcon, 
  PlayIcon, 
  CheckIcon,
  CurrencyDollarIcon,
  XMarkIcon 
} from "@heroicons/react/24/outline";
import { useJobs } from "../hooks/useJobs";
import { createJob, JobCreate, completeMilestone, releasePayment, getJobDetails } from "../services/api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatRelativeTime } from "../utils/formatting";
import { Modal } from "../components/ui/Modal";
import { Job } from "../types";
import toast from 'react-hot-toast';

export const Jobs: React.FC = () => {
  const { jobs, mutate } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [loadingMilestone, setLoadingMilestone] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

  /* form state */
  const [title, setTitle] = useState("");
  const [totalAmount, setTotal] = useState<number | "">("");
  const [description, setDesc] = useState("");
  const [client, setClient] = useState("");
  const [contractor, setContractor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setTotal("");
    setDesc("");
    setClient("");
    setContractor("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!title.trim() || totalAmount === "" || +totalAmount <= 0) {
      setError("Title and positive amount required");
      return;
    }
    setSaving(true);
    
    // Create sample milestones
    const milestones = [
      {
        title: "Project Setup",
        description: "Initial project setup and planning",
        amount: +totalAmount * 0.3,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Development Phase",
        description: "Core development work",
        amount: +totalAmount * 0.5,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Final Delivery",
        description: "Testing, deployment and handover",
        amount: +totalAmount * 0.2,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const payload: JobCreate = {
      title,
      description,
      client,
      contractor,
      totalAmount: +totalAmount,
      currency: "USD",
      milestones,
    };
    
    try {
      await createJob(payload);
      await mutate(); // refresh list
      setIsCreateOpen(false);
      resetForm();
      toast.success('Job created successfully!');
    } catch (e: any) {
      setError(e.message ?? "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  const handleJobClick = async (job: any) => {
    console.log('Job card clicked:', job);
    try {
      setIsJobDetailsOpen(true); // Open modal immediately for better UX
      setSelectedJob(job); // Set basic job data first
      
      const jobDetails = await getJobDetails(job.id);
      console.log('Job details loaded:', jobDetails);
      setSelectedJob(jobDetails);
    } catch (error) {
      console.error('Failed to load job details:', error);
      setIsJobDetailsOpen(false); // Close modal on error
      setSelectedJob(null);
      toast.error('Failed to load job details');
    }
  };

  const handleCompleteMilestone = async (jobId: string, milestoneId: string) => {
    setLoadingMilestone(milestoneId);
    try {
      const result = await completeMilestone(jobId, milestoneId);
      console.log('Milestone completed:', result);
      toast.success('Milestone completed successfully!');
      
      // Refresh job details
      const updatedJob = await getJobDetails(jobId);
      setSelectedJob(updatedJob);
      await mutate(); // Refresh jobs list
    } catch (error: any) {
      console.error('Failed to complete milestone:', error);
      toast.error(error.response?.data?.message || 'Failed to complete milestone');
    } finally {
      setLoadingMilestone(null);
    }
  };

  const handleReleasePayment = async (jobId: string, milestoneId: string) => {
    setLoadingPayment(milestoneId);
    try {
      const result = await releasePayment(jobId, milestoneId);
      console.log('Payment released:', result);
      toast.success(`Payment of ${formatCurrency(result.amount)} released successfully!`);
      
      // Refresh job details
      const updatedJob = await getJobDetails(jobId);
      setSelectedJob(updatedJob);
      await mutate(); // Refresh jobs list
    } catch (error: any) {
      console.error('Failed to release payment:', error);
      toast.error(error.response?.data?.message || 'Failed to release payment');
    } finally {
      setLoadingPayment(null);
    }
  };

  const statusColor = (status: string): "default" | "success" | "warning" | "info" | "error" => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "info";
      case "disputed":
        return "error";
      default:
        return "default";
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "released":
        return "info";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Create Job
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job: any, i: any) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card 
              hoverable 
              className="cursor-pointer transition-all duration-200 hover:scale-105" 
              onClick={(e) => {
                e.preventDefault();
                console.log('Card clicked for job:', job.id);
                handleJobClick(job);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{job.title}</h3>
                  <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="truncate ml-2">{job.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contractor</span>
                    <span className="truncate ml-2">{job.contractor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold">{formatCurrency(job.totalAmount, job.currency)}</span>
                  </div>
                </div>

                {job.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{job.location.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>{formatRelativeTime(job.updatedAt)}</span>
                  </div>
                  <span>{job.milestones?.length || 0} milestones</span>
                </div>

                {/* Progress bar */}
                {job.milestones && job.milestones.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-medium">
                        {job.milestones.filter((m: any) => m.status === "Completed" || m.status === "Released").length} / {job.milestones.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(job.milestones.filter((m: any) => m.status === "Completed" || m.status === "Released").length / job.milestones.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={isJobDetailsOpen}
        onClose={() => {
          console.log('Closing job details modal');
          setIsJobDetailsOpen(false);
          setSelectedJob(null);
        }}
        title={selectedJob?.title || "Job Details"}
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Loading State */}
            {!selectedJob.milestones && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading job details...</span>
              </div>
            )}
            
            {/* Job Overview */}
            {selectedJob.milestones && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-2 font-medium">{selectedJob.client}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contractor:</span>
                    <span className="ml-2 font-medium">{selectedJob.contractor}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="ml-2 font-bold">{formatCurrency(selectedJob.totalAmount, selectedJob.currency)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={statusColor(selectedJob.status)} className="ml-2">
                      {selectedJob.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-gray-700">{selectedJob.description}</p>
                </div>
              </div>
            )}

            {/* Milestones */}
            {selectedJob.milestones && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Milestones & Payments</h3>
                <div className="space-y-4">
                  {selectedJob.milestones?.map((milestone: any, index: number) => (
                    <Card key={milestone.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                                <p className="text-sm text-gray-500">{milestone.description}</p>
                              </div>
                            </div>
                            
                            <div className="ml-11 flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-500">
                                  Amount: <span className="font-medium">{formatCurrency(milestone.amount, selectedJob.currency)}</span>
                                </span>
                                <span className="text-gray-500">
                                  Due: <span className="font-medium">{new Date(milestone.dueDate).toLocaleDateString()}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant={getMilestoneStatusColor(milestone.status)}>
                                  {milestone.status}
                                </Badge>
                                
                                {milestone.status === "Pending" && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleCompleteMilestone(selectedJob.id, milestone.id)}
                                    isLoading={loadingMilestone === milestone.id}
                                    leftIcon={<CheckIcon className="w-4 h-4" />}
                                  >
                                    Complete
                                  </Button>
                                )}
                                
                                {milestone.status === "Completed" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleReleasePayment(selectedJob.id, milestone.id)}
                                    isLoading={loadingPayment === milestone.id}
                                    leftIcon={<CurrencyDollarIcon className="w-4 h-4" />}
                                  >
                                    Release Payment
                                  </Button>
                                )}
                                
                                {milestone.status === "Released" && (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckIcon className="w-4 h-4 mr-1" />
                                    Payment Released
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Job Modal */}
      <Modal
        isOpen={isCreateOpen}
        title="Create Job"
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Job Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
            <input 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              type="number" 
              placeholder="Total Amount" 
              value={totalAmount} 
              onChange={(e) => setTotal(e.target.value === "" ? "" : +e.target.value)} 
            />
          </div>
          <textarea 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            rows={3} 
            placeholder="Description" 
            value={description} 
            onChange={(e) => setDesc(e.target.value)} 
          />
          <div className="grid md:grid-cols-2 gap-4">
            <input 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Client" 
              value={client} 
              onChange={(e) => setClient(e.target.value)} 
            />
            <input 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Contractor" 
              value={contractor} 
              onChange={(e) => setContractor(e.target.value)} 
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-3">
            <Button 
              disabled={saving} 
              className="flex-1" 
              onClick={handleCreate}
              isLoading={saving}
            >
              Create Job
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};