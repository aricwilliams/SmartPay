import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon, MapPinIcon, ClockIcon, PlayIcon, CheckIcon, CurrencyDollarIcon, XMarkIcon, EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useJobs } from "../hooks/useJobs";
import { createJob, JobCreate, completeMilestone, releasePayment, getJobDetails } from "../services/api";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatRelativeTime } from "../utils/formatting";
import { Modal } from "../components/ui/Modal";
import { Job } from "../types";
import toast from "react-hot-toast";

export const Jobs: React.FC = () => {
  const { jobs, mutate } = useJobs();
  const { refreshWallets } = useWallet();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [loadingMilestone, setLoadingMilestone] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

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
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Development Phase",
        description: "Core development work",
        amount: +totalAmount * 0.5,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Final Delivery",
        description: "Testing, deployment and handover",
        amount: +totalAmount * 0.2,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
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
      toast.success("Job created successfully!");
    } catch (e: any) {
      setError(e.message ?? "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  const handleJobClick = async (job: any, event: React.MouseEvent) => {
    // Prevent modal opening when clicking action buttons
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    console.log("Job card clicked:", job);
    try {
      setIsJobDetailsOpen(true);
      setSelectedJob(job);

      const jobDetails = await getJobDetails(job.id);
      console.log("Job details loaded:", jobDetails);
      setSelectedJob(jobDetails);
    } catch (error) {
      console.error("Failed to load job details:", error);
      setIsJobDetailsOpen(false);
      setSelectedJob(null);
      toast.error("Failed to load job details");
    }
  };

  const handleCompleteMilestone = async (jobId: string, milestoneId: string) => {
    setLoadingMilestone(milestoneId);
    try {
      const result = await completeMilestone(jobId, milestoneId);
      console.log("Milestone completed:", result);
      toast.success("Milestone completed successfully!");

      // Refresh job details and jobs list
      if (selectedJob) {
        const updatedJob = await getJobDetails(jobId);
        setSelectedJob(updatedJob);
      }
      await mutate();
    } catch (error: any) {
      console.error("Failed to complete milestone:", error);
      toast.error(error.response?.data?.message || "Failed to complete milestone");
    } finally {
      setLoadingMilestone(null);
    }
  };

  const handleReleasePayment = async (jobId: string, milestoneId: string) => {
    setLoadingPayment(milestoneId);
    try {
      const result = await releasePayment(jobId, milestoneId);
      console.log("Payment released:", result);
      toast.success(`Payment of ${formatCurrency(result.amount)} released successfully!`);

      // Refresh wallets to show updated balances and transactions
      await refreshWallets();

      // Refresh job details and jobs list
      if (selectedJob) {
        const updatedJob = await getJobDetails(jobId);
        setSelectedJob(updatedJob);
      }
      await mutate();
    } catch (error: any) {
      console.error("Failed to release payment:", error);
      toast.error(error.response?.data?.message || "Failed to release payment");
    } finally {
      setLoadingPayment(null);
    }
  };

  // Quick action for progressing job milestones
  const handleQuickProgress = async (job: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setProcessingJobId(job.id);

    try {
      // Find the next milestone to progress
      const pendingMilestone = job.milestones?.find((m: any) => m.status === "Pending");
      const completedMilestone = job.milestones?.find((m: any) => m.status === "Completed");

      if (pendingMilestone) {
        // Complete the next pending milestone
        await completeMilestone(job.id, pendingMilestone.id);
        toast.success(`Milestone "${pendingMilestone.title}" completed!`);
      } else if (completedMilestone) {
        // Release payment for completed milestone
        await releasePayment(job.id, completedMilestone.id);
        toast.success(`Payment released for "${completedMilestone.title}"!`);

        // Refresh wallets after payment release
        await refreshWallets();
      } else {
        toast.info("No milestones available to progress");
      }

      await mutate(); // Refresh jobs list
    } catch (error: any) {
      console.error("Quick progress failed:", error);
      toast.error("Failed to progress milestone");
    } finally {
      setProcessingJobId(null);
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

  const getNextAction = (job: any) => {
    if (!job.milestones || job.milestones.length === 0) return null;

    const pendingMilestone = job.milestones.find((m: any) => m.status === "Pending");
    const completedMilestone = job.milestones.find((m: any) => m.status === "Completed");

    if (pendingMilestone) {
      return {
        type: "complete",
        milestone: pendingMilestone,
        label: `Complete: ${pendingMilestone.title}`,
        icon: CheckIcon,
        color: "bg-blue-500 hover:bg-blue-600",
      };
    } else if (completedMilestone) {
      return {
        type: "release",
        milestone: completedMilestone,
        label: `Release: ${formatCurrency(completedMilestone.amount)}`,
        icon: CurrencyDollarIcon,
        color: "bg-green-500 hover:bg-green-600",
      };
    }

    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage jobs and process milestone payments</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Create Job
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job: any, i: any) => {
          const nextAction = getNextAction(job);
          const completedMilestones = job.milestones?.filter((m: any) => m.status === "Completed" || m.status === "Released").length || 0;
          const totalMilestones = job.milestones?.length || 0;
          const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

          return (
            <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hoverable className="cursor-pointer transition-all duration-200 hover:scale-105 relative" onClick={(event) => handleJobClick(job, event)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{job.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                    </div>
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
                    <span>{totalMilestones} milestones</span>
                  </div>

                  {/* Progress bar */}
                  {totalMilestones > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress:</span>
                        <span className="font-medium">
                          {completedMilestones} / {totalMilestones}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJobClick(job, e);
                      }}
                      leftIcon={<EyeIcon className="w-4 h-4" />}
                    >
                      View Details
                    </Button>

                    {nextAction && (
                      <Button size="sm" variant="primary" className="flex-1" onClick={(e) => handleQuickProgress(job, e)} isLoading={processingJobId === job.id} leftIcon={<nextAction.icon className="w-4 h-4" />}>
                        {nextAction.type === "complete" ? "Complete" : "Release"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Job Details Modal */}
      <Modal
        isOpen={isJobDetailsOpen}
        onClose={() => {
          console.log("Closing job details modal");
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500 block">Client:</span>
                      <span className="font-medium text-gray-900">{selectedJob.client}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Total Amount:</span>
                      <span className="font-bold text-xl text-gray-900">{formatCurrency(selectedJob.totalAmount, selectedJob.currency)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500 block">Contractor:</span>
                      <span className="font-medium text-gray-900">{selectedJob.contractor}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Status:</span>
                      <Badge variant={statusColor(selectedJob.status)} className="text-sm">
                        {selectedJob.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <span className="text-gray-500 block mb-2">Description:</span>
                  <p className="text-gray-700">{selectedJob.description}</p>
                </div>
              </div>
            )}

            {/* Milestones */}
            {selectedJob.milestones && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Milestone Progress</h3>
                  <span className="text-sm text-gray-500">
                    {selectedJob.milestones.filter((m: any) => m.status === "Completed" || m.status === "Released").length} of {selectedJob.milestones.length} completed
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedJob.milestones?.map((milestone: any, index: number) => (
                    <Card key={milestone.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold ${milestone.status === "Released" ? "bg-green-500" : milestone.status === "Completed" ? "bg-blue-500" : "bg-gray-400"}`}>
                                {milestone.status === "Released" ? <CurrencyDollarIcon className="w-5 h-5" /> : milestone.status === "Completed" ? <CheckIcon className="w-5 h-5" /> : index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg">{milestone.title}</h4>
                                <p className="text-gray-600 mt-1">{milestone.description}</p>
                              </div>
                            </div>

                            <div className="ml-14 space-y-3">
                              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-6 text-sm">
                                  <span className="text-gray-500">
                                    Amount: <span className="font-semibold text-gray-900">{formatCurrency(milestone.amount, selectedJob.currency)}</span>
                                  </span>
                                  <span className="text-gray-500">
                                    Due: <span className="font-semibold text-gray-900">{new Date(milestone.dueDate).toLocaleDateString()}</span>
                                  </span>
                                </div>

                                <div className="flex items-center space-x-3">
                                  <Badge variant={getMilestoneStatusColor(milestone.status)} className="text-sm">
                                    {milestone.status}
                                  </Badge>

                                  {milestone.status !== "Released" && (
                                    <Button size="sm" variant="primary" onClick={() => handleCompleteMilestone(selectedJob.id, milestone.id)} isLoading={loadingMilestone === milestone.id} leftIcon={<CheckIcon className="w-4 h-4" />}>
                                      {milestone.status === "Completed" ? "Re-Complete" : "Mark Complete"}
                                    </Button>
                                  )}

                                  {milestone.status !== "Released" && (
                                    <Button size="sm" variant="secondary" onClick={() => handleReleasePayment(selectedJob.id, milestone.id)} isLoading={loadingPayment === milestone.id} leftIcon={<CurrencyDollarIcon className="w-4 h-4" />}>
                                      Release Payment
                                    </Button>
                                  )}

                                  {milestone.status === "Released" && (
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                      <CheckIcon className="w-4 h-4 mr-2" />
                                      Payment Released
                                    </div>
                                  )}
                                </div>
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
        title="Create New Job"
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter job title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (USD)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" type="number" placeholder="0.00" value={totalAmount} onChange={(e) => setTotal(e.target.value === "" ? "" : +e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Describe the job requirements and deliverables" value={description} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Client name or company" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contractor name" value={contractor} onChange={(e) => setContractor(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button disabled={saving} className="flex-1" onClick={handleCreate} isLoading={saving}>
              Create Job with Milestones
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
