import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatRelativeTime } from '../utils/formatting';
import { Job } from '../types';

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'City Center Delivery',
    description: 'Deliver packages to downtown business district',
    client: 'FastShip Logistics',
    contractor: 'Mike Johnson',
    totalAmount: 2500,
    currency: 'USD',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: '123 Main St, New York, NY'
    },
    milestones: [
      {
        id: '1',
        title: 'Pickup Confirmation',
        description: 'Confirm package pickup from warehouse',
        amount: 500,
        status: 'completed',
        dueDate: '2024-01-15T12:00:00Z',
        conditions: []
      },
      {
        id: '2',
        title: 'Delivery Completion',
        description: 'Deliver all packages to destinations',
        amount: 2000,
        status: 'in_progress',
        dueDate: '2024-01-15T18:00:00Z',
        conditions: []
      }
    ]
  },
  {
    id: '2',
    title: 'Website Development',
    description: 'Build responsive e-commerce website',
    client: 'TechStart Inc',
    contractor: 'Sarah Chen',
    totalAmount: 5000,
    currency: 'USDC',
    status: 'pending',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    milestones: [
      {
        id: '3',
        title: 'Design Mockups',
        description: 'Create initial design concepts',
        amount: 1500,
        status: 'pending',
        dueDate: '2024-01-20T17:00:00Z',
        conditions: []
      },
      {
        id: '4',
        title: 'Frontend Development',
        description: 'Implement responsive frontend',
        amount: 2500,
        status: 'pending',
        dueDate: '2024-01-25T17:00:00Z',
        conditions: []
      },
      {
        id: '5',
        title: 'Backend Integration',
        description: 'Connect to payment and inventory systems',
        amount: 1000,
        status: 'pending',
        dueDate: '2024-01-30T17:00:00Z',
        conditions: []
      }
    ]
  }
];

export const Jobs: React.FC = () => {
  const [jobs] = useState<Job[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'disputed': return 'error';
      default: return 'default';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'default';
      case 'released': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Create Job
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable className="cursor-pointer" onClick={() => setSelectedJob(job)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                  <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium">{job.client}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Contractor:</span>
                    <span className="font-medium">{job.contractor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(job.totalAmount, job.currency)}</span>
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

                {/* Milestone Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress:</span>
                    <span className="font-medium">
                      {job.milestones.filter(m => m.status === 'completed').length} / {job.milestones.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(job.milestones.filter(m => m.status === 'completed').length / job.milestones.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Job Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <Badge variant={getStatusColor(selectedJob.status)}>{selectedJob.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium">{selectedJob.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contractor:</span>
                    <span className="font-medium">{selectedJob.contractor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-bold">{formatCurrency(selectedJob.totalAmount, selectedJob.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{formatRelativeTime(selectedJob.createdAt)}</span>
                  </div>
                </div>
              </div>

              {selectedJob.location && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      {selectedJob.location.address}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Lat: {selectedJob.location.lat}, Lng: {selectedJob.location.lng}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
              <p className="text-sm text-gray-600">{selectedJob.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Milestones</h4>
              <div className="space-y-3">
                {selectedJob.milestones.map((milestone) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getMilestoneStatusColor(milestone.status)}>{milestone.status}</Badge>
                        <span className="text-sm font-bold">{formatCurrency(milestone.amount, selectedJob.currency)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      Due: {formatRelativeTime(milestone.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="primary">Release Next Milestone</Button>
              <Button variant="outline">Add Evidence</Button>
              <Button variant="outline">Edit Job</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Job"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the job requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contractor name"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="primary" className="flex-1">Create Job</Button>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};