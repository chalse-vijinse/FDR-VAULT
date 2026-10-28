import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';

export default function VerificationQueue() {
  const { role, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterAssigned, setFilterAssigned] = useState(role === 'VERIFICATION_OFFICER' ? 'me' : 'all');

  // Assignment Modal State (for Super Admin)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignPriority, setAssignPriority] = useState('Medium');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = {
        priority: priorityFilter,
        status: statusFilter,
        filterAssigned
      };
      const res = await api.get('/verifications', { params });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Load officers if Super Admin
    if (role === 'SUPER_ADMIN') {
      api.get('/users?role=VERIFICATION_OFFICER').then((res) => {
        if (res.data.success) {
          setOfficers(res.data.data);
          if (res.data.data.length > 0) setSelectedOfficer(res.data.data[0].id);
        }
      }).catch(console.error);
    }
  }, [priorityFilter, statusFilter, filterAssigned]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedFdrId || !selectedOfficer) return;

    setAssigning(true);
    try {
      const res = await api.post(`/verifications/${selectedFdrId}/assign`, {
        officer_id: selectedOfficer,
        priority: assignPriority,
        due_date: assignDueDate || null,
        notes: assignNotes
      });
      if (res.data.success) {
        setAssignModalOpen(false);
        fetchQueue();
      }
    } catch (err) {
      alert('Assignment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Document Verification & Audit Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate submitted security deposit certificates, examine OCR discrepancies, and certify bank lien endorsements
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">Priority: All</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">Status: All Active Workflow</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Clarification Required">Clarification Required</option>
              <option value="Resubmitted">Resubmitted</option>
              <option value="Pending Admin Approval">Pending Admin Approval</option>
            </select>
          </div>

          {role === 'VERIFICATION_OFFICER' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterAssigned('me')}
                className={`px-3 py-1 rounded-md font-medium ${
                  filterAssigned === 'me' ? 'bg-white shadow-2xs text-royal-700' : 'text-slate-600'
                }`}
              >
                Assigned to Me
              </button>
              <button
                type="button"
                onClick={() => setFilterAssigned('all')}
                className={`px-3 py-1 rounded-md font-medium ${
                  filterAssigned === 'all' ? 'bg-white shadow-2xs text-royal-700' : 'text-slate-600'
                }`}
              >
                All Submissions
              </button>
            </div>
          )}
        </div>

        <div className="text-slate-500 font-medium">
          {tasks.length} Cases Requiring Verification
        </div>
      </div>

      {/* Task Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading verification queue...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Verification Queue Clear"
            description="There are currently no deposit records pending verification matching your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">FDR Ref / Bank</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4 text-right">Deposit Amount</th>
                  <th className="py-3 px-4">Priority / Due Date</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Status & Flags</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono">
                        {task.fdr_number || `Deposit #${task.id}`}
                      </div>
                      <div className="text-[11px] text-slate-500">{task.bank_name || 'Bank'} &bull; {task.record_type}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 line-clamp-1">{task.institution_name}</div>
                      <div className="text-[10px] text-slate-400">{task.institution_state} &bull; {task.document_count} doc(s)</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{Number(task.deposit_amount).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        task.task_priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {task.task_priority || 'Normal'}
                      </span>
                      {task.task_due_date && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Due: {task.task_due_date}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {task.assigned_officer_name ? (
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-royal-600" />
                          {task.assigned_officer_name}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={task.status} />
                      {task.discrepancy_flag === 1 && (
                        <span className="block mt-1 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Discrepancy Flagged
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center space-x-2 whitespace-nowrap">
                      {role === 'SUPER_ADMIN' && !task.assigned_officer_name && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFdrId(task.id);
                            setAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                        >
                          Assign
                        </button>
                      )}
                      <Link
                        to={`/verifications/${task.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-royal-600 hover:bg-royal-700 text-white shadow-2xs transition-colors"
                      >
                        Inspect & Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal for Super Admin */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Verification Task">
        <form onSubmit={handleAssignTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Verification Officer *</label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
              required
            >
              {officers.map((o) => (
                <option key={o.id} value={o.id}>{o.full_name} ({o.email}) - {o.designation}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Task Priority</label>
              <select
                value={assignPriority}
                onChange={(e) => setAssignPriority(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instructions for Officer</label>
            <textarea
              rows="2"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="e.g. Inspect branch manager seal and confirm joint lien status with State Bank of India..."
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="px-4 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
