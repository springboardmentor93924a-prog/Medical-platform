import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldAlert, 
  ShieldCheck,
  CheckCircle2, 
  FileText, 
  HardDrive, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Archive,
  Layers,
  CalendarCheck
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { backupService } from '../../services/backupService';
import { useNotification } from '../../context/NotificationContext';

export const BackupRestorePage = () => {
  const { showToast } = useNotification();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [confirmSafetyCheck, setConfirmSafetyCheck] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Restore Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [confirmUploadSafetyCheck, setConfirmUploadSafetyCheck] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await backupService.getHistory();
      const data = res?.data?.data || res?.data || res;
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching backup history', err);
      showToast('error', 'Failed to retrieve backup history');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCreateBackup = async () => {
    try {
      setIsCreating(true);
      const res = await backupService.createBackup();
      const data = res?.data?.data || res?.data || res;
      showToast('success', `Point-in-time snapshot created: ${data.fileName || 'MediStock Backup'}`);
      fetchHistory();
    } catch (err) {
      console.error('Error creating backup', err);
      showToast('error', err.response?.data?.message || 'Backup generation failed.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      showToast('info', `Downloading snapshot ${backup.fileName}...`);
      const res = await backupService.downloadBackup(backup.id);
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.fileName || `medistock_backup_${backup.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading backup', err);
      showToast('error', 'Failed to download backup file');
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup || !confirmSafetyCheck) return;

    try {
      setIsRestoring(true);
      const res = await backupService.restoreBackup(selectedBackup.id);
      const msg = res?.data?.message || 'Database restored successfully! A safety snapshot was archived.';
      showToast('success', msg);
      setIsRestoreModalOpen(false);
      setSelectedBackup(null);
      setConfirmSafetyCheck(false);
      fetchHistory();
    } catch (err) {
      console.error('Error restoring backup', err);
      showToast('error', err.response?.data?.message || 'Restore failed.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      setIsDeleting(true);
      await backupService.deleteBackup(backupToDelete.id);
      showToast('success', `Snapshot ${backupToDelete.fileName} permanently removed.`);
      setIsDeleteModalOpen(false);
      setBackupToDelete(null);
      fetchHistory();
    } catch (err) {
      console.error('Error deleting backup', err);
      showToast('error', err.response?.data?.message || 'Failed to delete backup snapshot.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadRestore = async (e) => {
    e.preventDefault();
    if (!uploadFile || !confirmUploadSafetyCheck) {
      showToast('error', 'Please select a backup file and confirm the safety check.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await backupService.restoreFromUpload(formData);
      const msg = res?.data?.message || 'Snapshot uploaded and restored successfully!';
      showToast('success', msg);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setConfirmUploadSafetyCheck(false);
      fetchHistory();
    } catch (err) {
      console.error('Error uploading backup', err);
      showToast('error', err.response?.data?.message || 'Uploaded backup restoration failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStorage = history.reduce((acc, item) => acc + (item.fileSizeBytes || item.fileSize || 0), 0);
  const latestSnapshot = history.length > 0 ? history[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-600" />
            System Backup & Disaster Recovery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate full point-in-time snapshots, download encrypted backup JSON archives, or restore previous system states with automatic safety rollbacks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Backup
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            isLoading={isCreating}
            onClick={handleCreateBackup}
          >
            Create Instant Backup
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Snapshots</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{history.length}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Point-in-Time Archives</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Backup</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[150px]" title={latestSnapshot ? new Date(latestSnapshot.createdAt).toLocaleString() : 'No snapshots'}>
              {latestSnapshot ? new Date(latestSnapshot.createdAt).toLocaleDateString() : 'None'}
            </p>
            <span className="text-[11px] text-slate-400">
              {latestSnapshot ? new Date(latestSnapshot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Consumed</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formatFileSize(totalStorage)}</p>
            <span className="text-[11px] text-slate-400 font-mono">Dedicated Disk Space</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safeguard Engine</span>
            <p className="text-base font-bold text-emerald-600 mt-0.5">Active Protection</p>
            <span className="text-[11px] text-slate-400">Pre-restore Safety Snapshots</span>
          </div>
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-950">Disaster Recovery Safeguard Active</p>
          <p className="text-amber-800 leading-relaxed">
            Before applying any restore operation, MediStock automatically generates an emergency pre-restore snapshot. Restoring replaces current medicine records, stock levels, categories, users, notifications, system settings, and orders with the archived snapshot.
          </p>
        </div>
      </div>

      {/* History Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Snapshot Archive History</h2>
            <Badge variant="default" size="sm">{history.length} Snapshots</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchHistory}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No backup archives yet"
            description="Create your first point-in-time system backup to protect critical inventory records."
            action={
              <Button variant="primary" icon={Plus} onClick={handleCreateBackup} isLoading={isCreating}>
                Create Instant Backup
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Archive Name</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Total Records</th>
                  <th className="py-3 px-4">Checksum (SHA-256)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[220px]" title={item.fileName}>
                        {item.fileName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {formatFileSize(item.fileSizeBytes || item.fileSize)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {item.totalRecords != null ? item.totalRecords : '—'}
                      </span>
                      {item.recordCounts && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[200px]" title={item.recordCounts}>
                          {item.recordCounts}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                      <span title={item.checksumSha256}>
                        {item.checksumSha256 ? item.checksumSha256.substring(0, 12) + '...' : 'Verified'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => {
                          setSelectedBackup(item);
                          setConfirmSafetyCheck(false);
                          setIsRestoreModalOpen(true);
                        }}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        icon={Trash2}
                        onClick={() => {
                          setBackupToDelete(item);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Confirm Restore */}
      {selectedBackup && (
        <Modal
          isOpen={isRestoreModalOpen}
          onClose={() => {
            setIsRestoreModalOpen(false);
            setSelectedBackup(null);
          }}
          title="Confirm Database Restoration"
          subtitle={`Target Snapshot: ${selectedBackup.fileName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Warning: Irreversible Overwrite Notice
              </div>
              <p className="text-rose-800 leading-relaxed">
                Restoring this backup will replace current medicine catalogs, category trees, users, inventory movements, notifications, settings, and orders with data from <strong>{new Date(selectedBackup.createdAt).toLocaleString()}</strong>.
              </p>
              <p className="text-rose-800 font-semibold">
                An automatic pre-restore safety snapshot will be recorded before changes are committed.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmSafetyCheck}
                onChange={(e) => setConfirmSafetyCheck(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                I understand this operation replaces existing records and I authorize this restoration.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={RotateCcw}
                disabled={!confirmSafetyCheck}
                isLoading={isRestoring}
                onClick={handleRestore}
              >
                Execute Restore
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirm Delete */}
      {backupToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBackupToDelete(null);
          }}
          title="Delete Database Snapshot"
          subtitle={`Archive: ${backupToDelete.fileName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Permanent Deletion Warning
              </div>
              <p className="text-rose-800 leading-relaxed">
                Are you sure you want to permanently delete snapshot <strong>{backupToDelete.fileName}</strong> ({formatFileSize(backupToDelete.fileSizeBytes || backupToDelete.fileSize)})?
              </p>
              <p className="text-rose-700">
                This will delete the file from the server storage and remove the record from the archive index. This operation cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                isLoading={isDeleting}
                onClick={handleDeleteBackup}
              >
                Delete Snapshot
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Upload & Restore Backup */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setConfirmUploadSafetyCheck(false);
        }}
        title="Upload & Restore Backup Archive"
        subtitle="Import a previously downloaded MediStock JSON backup file"
      >
        <form onSubmit={handleUploadRestore} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Backup JSON File</label>
            <input
              type="file"
              accept=".json"
              required
              onChange={(e) => setUploadFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmUploadSafetyCheck}
              onChange={(e) => setConfirmUploadSafetyCheck(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              I verify that this JSON archive is from a trusted MediStock installation and authorize database replacement.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              icon={Upload}
              disabled={!uploadFile || !confirmUploadSafetyCheck}
              isLoading={isUploading}
            >
              Upload & Restore
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BackupRestorePage;
