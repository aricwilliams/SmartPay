// src/pages/Jobs.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useJobs } from "../hooks/useJobs";
import { createJob, JobCreate } from "../services/api";
import { Button } from "@headlessui/react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { formatCurrency, formatRelativeTime } from "../utils/formatting";
import { Modal } from "../components/ui/Modal";
import { Job } from "../types";

export const Jobs: React.FC = () => {
  const { jobs, mutate } = useJobs();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    const payload: JobCreate = {
      title,
      description,
      client,
      contractor,
      totalAmount: +totalAmount,
      currency: "USD",
      milestones: [],
    };
    try {
      await createJob(payload);
      await mutate(); // refresh list
      setIsCreateOpen(false);
      resetForm();
    } catch (e: any) {
      setError(e.message ?? "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: string): "default" | "success" | "warning" | "info" | "error" => {
    switch (status) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Job
        </Button>
      </div>

      {/* grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job: any, i: any) => (
          <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hoverable onClick={() => setSelectedJob(job)}>
              <CardHeader className="pb-3 flex justify-between">
                <h3 className="font-semibold truncate">{job.title}</h3>
                <Badge variant={statusColor(job.status)}>{job.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm truncate text-gray-600">{job.description}</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span>{job.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contractor</span>
                    <span>{job.contractor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold">{formatCurrency(job.totalAmount, job.currency)}</span>
                  </div>
                </div>

                {job.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span className="truncate">{job.location.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>{formatRelativeTime(job.updatedAt)}</span>
                  </div>
                  <span>{job.milestones.length} milestones</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress:</span>
                    <span className="font-medium">
                      {job.milestones.filter((m) => m.status === "completed").length} / {job.milestones.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(job.milestones.filter((m) => m.status === "completed").length / job.milestones.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* details modal */}
      {selectedJob && (
        <Modal isOpen title={selectedJob.title} onClose={() => setSelectedJob(null)}>
          <p className="text-gray-600">{selectedJob.description}</p>
        </Modal>
      )}

      {/* create modal */}
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
            <input className="border rounded-md px-3 py-2" placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="border rounded-md px-3 py-2" type="number" placeholder="Total Amount" value={totalAmount} onChange={(e) => setTotal(e.target.value === "" ? "" : +e.target.value)} />
          </div>
          <textarea className="w-full border rounded-md px-3 py-2" rows={3} placeholder="Description" value={description} onChange={(e) => setDesc(e.target.value)} />
          <div className="grid md:grid-cols-2 gap-4">
            <input className="border rounded-md px-3 py-2" placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} />
            <input className="border rounded-md px-3 py-2" placeholder="Contractor" value={contractor} onChange={(e) => setContractor(e.target.value)} />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex gap-3 pt-3">
            <Button disabled={saving} className="flex-1" onClick={handleCreate}>
              {saving ? "Creating…" : "Create"}
            </Button>
            <Button
              // variant="outline"
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
