import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Star, 
  Send, 
  Eye, 
  MessageCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  ThumbsUp,
  Package,
  Building2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { feedbackService } from '../../services/feedbackService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const FeedbackPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.role === 'ADMIN';

  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Submit Form
  const [formCategory, setFormCategory] = useState('GENERAL');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Status Update Form
  const [updateStatus, setUpdateStatus] = useState('UNDER_REVIEW');
  const [adminResponse, setAdminResponse] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      };

      const [res, statsRes] = await Promise.all([
        isAdmin ? feedbackService.getAllFeedback(params) : feedbackService.getMyFeedback(params),
        feedbackService.getStats().catch(() => null),
      ]);

      const data = res?.data?.data || res?.data || res;
      setFeedbacks(data?.content || (Array.isArray(data) ? data : []));
      setTotalPages(data?.totalPages || 1);

      if (statsRes) {
        setStats(statsRes?.data?.data || statsRes?.data || statsRes);
      }
    } catch (err) {
      console.error('Error fetching feedbacks', err);
      showToast('error', 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, isAdmin, showToast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      showToast('error', 'Subject and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await feedbackService.submitFeedback({
        category: formCategory,
        subject: formSubject.trim(),
        message: formMessage.trim(),
        description: formMessage.trim(),
        rating: Number(formRating),
      });

      showToast('success', 'Feedback submitted successfully. Thank you for your input!');
      setIsSubmitModalOpen(false);
      setFormCategory('GENERAL');
      setFormSubject('');
      setFormMessage('');
      setFormRating(5);
      fetchFeedbacks();
    } catch (err) {
      console.error('Error submitting feedback', err);
      showToast('error', err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedFeedback) return;

    try {
      setIsUpdatingStatus(true);
      await feedbackService.updateStatus(selectedFeedback.id, {
        status: updateStatus,
        adminResponse: adminResponse.trim(),
      });

      showToast('success', `Feedback status updated to ${updateStatus}`);
      setIsStatusModalOpen(false);
      setSelectedFeedback(null);
      setAdminResponse('');
      fetchFeedbacks();
    } catch (err) {
      console.error('Error updating feedback status', err);
      showToast('error', err.response?.data?.message || 'Failed to update feedback status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Closed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'BUG_REPORT':
        return <Bug className="w-4 h-4 text-rose-500" />;
      case 'FEATURE_REQUEST':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'INVENTORY_ISSUE':
        return <Package className="w-4 h-4 text-sky-500" />;
      case 'SERVICE_QUALITY':
        return <ThumbsUp className="w-4 h-4 text-emerald-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            {isAdmin ? 'Feedback & Inquiries Management' : 'User Feedback & Support'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin 
              ? 'Review, track, and respond to user suggestions, bug reports, and operational inquiries.'
              : 'Submit suggestions, report system issues, or ask questions to the MediStock administrator.'}
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus} 
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit Feedback
        </Button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total || 0}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-xs">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{stats.pending || 0}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-sky-200/80 bg-sky-50/30 shadow-xs">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Under Review</p>
            <p className="text-2xl font-black text-sky-900 mt-1">{stats.underReview || 0}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-xs">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{stats.resolved || 0}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter By:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Closed / Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="GENERAL">General Feedback</option>
          <option value="BUG_REPORT">Bug Report</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="INVENTORY_ISSUE">Inventory Issue</option>
          <option value="SERVICE_QUALITY">Service Quality</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : feedbacks.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No feedback records found"
            description="No feedback submissions match your current filters. Click 'Submit Feedback' to add one."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setIsSubmitModalOpen(true)}>
                Submit Feedback
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {feedbacks.map((fb) => (
              <div 
                key={fb.id} 
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
                      {getCategoryIcon(fb.category)}
                    </span>
                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      {fb.category?.replace(/_/g, ' ') || 'GENERAL'}
                    </span>
                    {getStatusBadge(fb.status)}
                    {fb.rating && (
                      <div className="flex items-center text-amber-500 text-xs ml-1 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                        {fb.rating}/5
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {fb.subject}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {fb.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                    <span>By: <strong className="text-slate-600">{fb.submittedByName || fb.userName || 'Anonymous'}</strong> ({fb.userRole || 'USER'})</span>
                    {fb.supplierCompanyName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                        <Building2 className="w-3 h-3" /> {fb.supplierCompanyName}
                      </span>
                    )}
                    <span>•</span>
                    <span>{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'Recent'}</span>
                    {fb.adminResponse && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Admin Responded
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => {
                      setSelectedFeedback(fb);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    View
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={MessageCircle}
                      onClick={() => {
                        setSelectedFeedback(fb);
                        setUpdateStatus(fb.status || 'UNDER_REVIEW');
                        setAdminResponse(fb.adminResponse || '');
                        setIsStatusModalOpen(true);
                      }}
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Submit Feedback */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Feedback & Suggestions"
        subtitle="Share operational feedback, request inventory improvements, or report bugs"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GENERAL">General Feedback</option>
                <option value="BUG_REPORT">Bug Report</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="INVENTORY_ISSUE">Inventory / Stock Issue</option>
                <option value="SERVICE_QUALITY">Service Quality</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Satisfaction Rating (1-5)</label>
              <select
                value={formRating}
                onChange={(e) => setFormRating(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                <option value="4">⭐⭐⭐⭐ 4 - Good</option>
                <option value="3">⭐⭐⭐ 3 - Average</option>
                <option value="2">⭐⭐ 2 - Poor</option>
                <option value="1">⭐ 1 - Critical Issue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="Brief summary of feedback or issue"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
            <textarea
              required
              rows={4}
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Provide complete details, affected medicine names, or steps to reproduce if reporting an issue..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={Send} isLoading={isSubmitting}>
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Feedback Details */}
      {selectedFeedback && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFeedback(null);
          }}
          title={selectedFeedback.subject}
          subtitle={`Submitted by ${selectedFeedback.submittedByName || selectedFeedback.userName || 'User'} on ${selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleString() : 'N/A'}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Category:</span>
              <span className="font-bold text-slate-800">{selectedFeedback.category}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-500">Status:</span>
              {getStatusBadge(selectedFeedback.status)}
              {selectedFeedback.rating && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-500">Rating:</span>
                  <span className="font-bold text-amber-600">{selectedFeedback.rating}/5 Stars</span>
                </>
              )}
            </div>

            {selectedFeedback.supplierCompanyName && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Supplier Profile</span>
                  <span className="text-xs font-bold text-indigo-950">{selectedFeedback.supplierCompanyName}</span>
                </div>
                {selectedFeedback.supplierContactPerson && (
                  <span className="text-xs text-indigo-700">Contact: <strong>{selectedFeedback.supplierContactPerson}</strong></span>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">User Message</label>
              <div className="p-3 bg-slate-50 rounded-xl text-slate-800 text-xs leading-relaxed whitespace-pre-wrap border border-slate-100">
                {selectedFeedback.message}
              </div>
            </div>

            {selectedFeedback.adminResponse && (
              <div className="space-y-1">
                <label className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Admin Response & Action Taken
                </label>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-950 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.adminResponse}
                  {selectedFeedback.respondedAt && (
                    <p className="text-[10px] text-emerald-700/80 mt-2 font-medium">
                      Responded on: {new Date(selectedFeedback.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Admin Update Status */}
      {selectedFeedback && isAdmin && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedFeedback(null);
          }}
          title="Review & Update Feedback Status"
          subtitle={`Subject: "${selectedFeedback.subject}"`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PENDING">Pending Review</option>
                <option value="UNDER_REVIEW">Under Review / In Progress</option>
                <option value="RESOLVED">Resolved / Action Completed</option>
                <option value="REJECTED">Closed / Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Response / Resolution Notes</label>
              <textarea
                rows={4}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Explain the resolution or message back to the submitting user..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingStatus}>
                Save Status & Response
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FeedbackPage;
