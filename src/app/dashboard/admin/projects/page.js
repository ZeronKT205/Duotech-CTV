'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FolderKanban, X, MessageSquare, ExternalLink, Link2, Ban, Save, Clock } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, PROJECT_STATUS, WEBSITE_TYPES } from '@/lib/utils';

export default function AdminProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCommissions, setProjectCommissions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Drag & drop note modal
  const [dragNote, setDragNote] = useState(null);
  const [dragNoteText, setDragNoteText] = useState('');
  const [processingDrag, setProcessingDrag] = useState(false);

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Add note modal  
  const [addNoteProject, setAddNoteProject] = useState(null);
  const [addNoteText, setAddNoteText] = useState('');

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects?all=true');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function openProjectDetail(projectId) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setSelectedProject(data.project);
      setProjectCommissions(data.commissions || []);
      setEditForm({
        customerName: data.project.customerName || '',
        zaloGroupLink: data.project.zaloGroupLink || '',
        contractValue: data.project.contractValue || 0,
        progress: data.project.progress || 0,
      });
    } catch (err) { console.error(err); }
    finally { setLoadingDetail(false); }
  }

  async function saveProjectEdit() {
    if (!selectedProject) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        fetchProjects();
        openProjectDetail(selectedProject._id);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function addNote(projectId, noteContent) {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteContent }),
      });
      fetchProjects();
      if (selectedProject?._id === projectId) {
        openProjectDetail(projectId);
      }
    } catch (err) { console.error(err); }
  }

  // Drag & Drop handlers
  const handleDragStart = (e, projectId) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (!projectId) return;

    const project = projects.find(p => p._id === projectId);
    if (!project || project.status === targetStatus) return;

    if (targetStatus === 'cancelled') {
      setCancelModal(project);
      return;
    }

    // Open note modal for status change
    setDragNote({ projectId, fromStatus: project.status, toStatus: targetStatus });
    setDragNoteText('');
  };

  async function confirmDragStatusChange() {
    if (!dragNote) return;
    setProcessingDrag(true);
    try {
      const res = await fetch(`/api/projects/${dragNote.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: dragNote.toStatus,
          noteContent: dragNoteText || undefined,
        }),
      });
      if (res.ok) {
        fetchProjects();
        setDragNote(null);
      }
    } catch (err) { console.error(err); }
    finally { setProcessingDrag(false); }
  }

  async function handleCancel() {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/projects/${cancelModal._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancelReason,
          noteContent: `Hủy dự án: ${cancelReason || 'Không có lý do'}`,
        }),
      });
      if (res.ok) {
        fetchProjects();
        setCancelModal(null);
        setCancelReason('');
      }
    } catch (err) { console.error(err); }
    finally { setCancelling(false); }
  }

  if (session?.user?.role !== 'admin') {
    return <div className="dash-body"><div className="empty-state"><h3>Bạn không có quyền truy cập</h3></div></div>;
  }

  const statusColors = {
    consulting: '#3b82f6',
    contracted: '#a855f7',
    in_progress: '#f97316',
    completed: '#10b981',
    cancelled: '#ef4444',
  };

  const activeStatuses = ['consulting', 'contracted', 'in_progress', 'completed'];
  const cancelledProjects = projects.filter(p => p.status === 'cancelled');

  return (
    <>
      <div className="dash-topbar">
        <div>
          <h1 className="dash-page-title">
            <FolderKanban size={22} /> Quản lý Dự án
          </h1>
          <p className="dash-page-subtitle">Kéo thả dự án để cập nhật tiến độ triển khai</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)' }}>
          Tổng: <strong>{projects.length}</strong> dự án
        </div>
      </div>

      <div className="dash-body">
        {loading ? (
          <div className="loading-page"><div className="loading-spinner"></div></div>
        ) : (
          <>
            {/* Kanban Board */}
            <div style={{
              display: 'flex',
              gap: 'var(--space-4)',
              overflowX: 'auto',
              paddingBottom: 'var(--space-4)',
              minHeight: '500px',
              alignItems: 'flex-start',
            }}>
              {activeStatuses.map(statusKey => {
                const statusInfo = PROJECT_STATUS[statusKey];
                const statusProjects = projects.filter(p => p.status === statusKey);

                return (
                  <div
                    key={statusKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, statusKey)}
                    style={{
                      flex: '1',
                      minWidth: '280px',
                      backgroundColor: 'var(--dt-light-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--dt-light-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      maxHeight: '750px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Column Header */}
                    <div style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '2px solid ' + statusColors[statusKey],
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderTopLeftRadius: 'var(--radius-md)',
                      borderTopRightRadius: 'var(--radius-md)',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '10px', height: '10px', borderRadius: '50%',
                          backgroundColor: statusColors[statusKey],
                        }}></span>
                        {statusInfo.label}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: 'var(--dt-light-border)',
                        color: 'var(--dt-light-text-secondary)',
                      }}>{statusProjects.length}</span>
                    </div>

                    {/* Column Body */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: 'var(--space-3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                      minHeight: '200px',
                    }}>
                      {statusProjects.length === 0 ? (
                        <div style={{
                          padding: 'var(--space-8) var(--space-4)',
                          textAlign: 'center',
                          color: 'var(--dt-light-text-muted)',
                          fontSize: '0.8rem',
                          border: '2px dashed var(--dt-light-border)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(0,0,0,0.01)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '100px',
                        }}>
                          Kéo thả dự án vào đây
                        </div>
                      ) : (
                        statusProjects.map(project => (
                          <div
                            key={project._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, project._id)}
                            onClick={() => openProjectDetail(project._id)}
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--dt-light-border)',
                              padding: 'var(--space-4)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                              cursor: 'grab',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                          >
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--dt-primary)' }}>{project.projectCode}</span>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '2px 7px',
                                backgroundColor: 'var(--dt-light-surface-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 700,
                                color: 'var(--dt-light-text)',
                                border: '1px solid var(--dt-light-border)',
                              }}>
                                {WEBSITE_TYPES[project.websiteType] || project.websiteType}
                              </span>
                            </div>

                            {/* Customer Name */}
                            {project.customerName && (
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--dt-light-text)' }}>
                                👤 {project.customerName}
                              </div>
                            )}

                            {/* Progress Bar */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--dt-light-text-muted)', fontWeight: 600 }}>Tiến độ</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: statusColors[statusKey] }}>{project.progress}%</span>
                              </div>
                              <div style={{
                                width: '100%', height: '6px',
                                backgroundColor: 'var(--dt-light-surface-3)',
                                borderRadius: '3px',
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${project.progress}%`,
                                  height: '100%',
                                  backgroundColor: statusColors[statusKey],
                                  borderRadius: '3px',
                                  transition: 'width 0.3s ease',
                                }}></div>
                              </div>
                            </div>

                            {/* Footer Info */}
                            <div style={{
                              borderTop: '1px solid var(--dt-light-border)',
                              paddingTop: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--dt-light-text-muted)',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>CTV: <strong>{project.ctvId?.name || '—'}</strong></span>
                                {project.zaloGroupLink && (
                                  <a href={project.zaloGroupLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                    style={{ color: '#3b82f6', fontWeight: 600 }}
                                  >
                                    <Link2 size={12} /> Zalo
                                  </a>
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: 'var(--dt-green)', fontSize: '0.85rem' }}>
                                  {project.contractValue > 0 ? formatCurrency(project.contractValue) : '— VNĐ'}
                                </span>
                              </div>
                              {/* Latest note snippet */}
                              {project.notes?.length > 0 && (
                                <div style={{
                                  marginTop: '4px',
                                  padding: '6px 8px',
                                  backgroundColor: 'var(--dt-light-surface-2)',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  color: 'var(--dt-light-text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  <MessageSquare size={10} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {project.notes[project.notes.length - 1]?.content || ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cancelled Projects Section */}
            {cancelledProjects.length > 0 && (
              <div className="dash-card" style={{ marginTop: 'var(--space-4)' }}>
                <div className="dash-card-header">
                  <h2 className="dash-card-title" style={{ color: '#ef4444' }}>
                    <Ban size={16} /> Dự án đã hủy ({cancelledProjects.length})
                  </h2>
                </div>
                <div className="dash-card-body" style={{ padding: 0 }}>
                  <div className="dash-table-container">
                    <table className="dash-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Mã DA</th>
                          <th>Khách hàng</th>
                          <th>CTV</th>
                          <th>Lý do hủy</th>
                          <th>Ngày hủy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancelledProjects.map(p => (
                          <tr key={p._id} style={{ opacity: 0.7 }}>
                            <td><strong>{p.projectCode}</strong></td>
                            <td>{p.customerName || '—'}</td>
                            <td>{p.ctvId?.name || '—'}</td>
                            <td style={{ fontStyle: 'italic', color: '#ef4444' }}>{p.cancelReason || '—'}</td>
                            <td>{p.cancelledAt ? formatDate(p.cancelledAt) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drag & Drop Note Modal */}
      {dragNote && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="dash-card-header" style={{ borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, fontSize: '1rem' }}>
                📝 Chuyển trạng thái dự án
              </h3>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <span className={`dash-badge ${PROJECT_STATUS[dragNote.fromStatus]?.color}`}>{PROJECT_STATUS[dragNote.fromStatus]?.label}</span>
                <span>→</span>
                <span className={`dash-badge ${PROJECT_STATUS[dragNote.toStatus]?.color}`}>{PROJECT_STATUS[dragNote.toStatus]?.label}</span>
              </div>
              <div className="dash-form-group">
                <label className="dash-form-label">Ghi chú (tùy chọn)</label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="VD: Đã ký HĐ trị giá 15tr, bắt đầu triển khai..."
                  value={dragNoteText}
                  onChange={(e) => setDragNoteText(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="dash-btn dash-btn-outline" onClick={() => setDragNote(null)}>Hủy</button>
                <button className="dash-btn dash-btn-primary" disabled={processingDrag} onClick={confirmDragStatusChange}>
                  {processingDrag ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Project Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="dash-card-header" style={{ borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={18} /> Hủy dự án {cancelModal.projectCode}
              </h3>
            </div>
            <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-secondary)', margin: 0 }}>
                ⚠️ Hoa hồng chưa thanh toán sẽ bị hủy theo. Hành động này không thể hoàn tác.
              </p>
              <div className="dash-form-group">
                <label className="dash-form-label">Lý do hủy <span className="dash-form-required">*</span></label>
                <textarea
                  className="dash-form-textarea"
                  placeholder="VD: Khách hàng hủy hợp đồng..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button className="dash-btn dash-btn-outline" onClick={() => setCancelModal(null)}>Quay lại</button>
                <button className="dash-btn dash-btn-danger" disabled={cancelling || !cancelReason.trim()} onClick={handleCancel}>
                  {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '800px', width: '100%', animation: 'fadeIn 0.2s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
            {loadingDetail ? (
              <div className="loading-page" style={{ minHeight: '300px' }}><div className="loading-spinner"></div></div>
            ) : (
              <>
                {/* Header */}
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dt-light-border)' }}>
                  <div>
                    <h3 className="dash-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedProject.projectCode}
                      <span className={`dash-badge ${PROJECT_STATUS[selectedProject.status]?.color}`}>
                        {PROJECT_STATUS[selectedProject.status]?.label}
                      </span>
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>
                      Đơn gốc: {selectedProject.orderCode} • {WEBSITE_TYPES[selectedProject.websiteType] || selectedProject.websiteType}
                    </span>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--dt-light-text-muted)' }}><X size={18} /></button>
                </div>

                <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tiến độ dự án</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: statusColors[selectedProject.status] }}>{selectedProject.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--dt-light-surface-3)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${selectedProject.progress}%`, height: '100%',
                        backgroundColor: statusColors[selectedProject.status],
                        borderRadius: '5px', transition: 'width 0.3s ease',
                      }}></div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="dash-form-group">
                      <label className="dash-form-label">Tên khách hàng</label>
                      <input type="text" className="dash-form-input" value={editForm.customerName}
                        onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} />
                    </div>
                    <div className="dash-form-group">
                      <label className="dash-form-label">Giá trị HĐ (VNĐ)</label>
                      <input type="number" className="dash-form-input" value={editForm.contractValue}
                        onChange={(e) => setEditForm({ ...editForm, contractValue: Number(e.target.value) })} />
                    </div>
                    <div className="dash-form-group">
                      <label className="dash-form-label">Link nhóm Zalo</label>
                      <input type="url" className="dash-form-input" value={editForm.zaloGroupLink}
                        onChange={(e) => setEditForm({ ...editForm, zaloGroupLink: e.target.value })} />
                    </div>
                    <div className="dash-form-group">
                      <label className="dash-form-label">Tiến độ (%)</label>
                      <input type="number" className="dash-form-input" min="0" max="100" value={editForm.progress}
                        onChange={(e) => setEditForm({ ...editForm, progress: Math.min(100, Math.max(0, Number(e.target.value))) })} />
                    </div>
                  </div>

                  <button className="dash-btn dash-btn-primary" disabled={saving} onClick={saveProjectEdit}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? 'Đang lưu...' : <><Save size={14} /> Lưu thay đổi</>}
                  </button>

                  {/* Info Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ padding: '14px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px solid var(--dt-light-border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-muted)' }}>CTV phụ trách</h4>
                      <div style={{ fontSize: '0.9rem' }}>
                        <strong>{selectedProject.ctvId?.name || '—'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>{selectedProject.ctvId?.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--dt-light-text-muted)' }}>{selectedProject.ctvId?.phone || 'Chưa có SĐT'}</div>
                      </div>
                    </div>
                    <div style={{ padding: '14px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', border: '1px solid var(--dt-light-border)' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dt-light-text-muted)' }}>Hoa hồng</h4>
                      {projectCommissions.length === 0 ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--dt-light-text-muted)', fontStyle: 'italic' }}>Chưa phát sinh</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {projectCommissions.map(c => (
                            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span>Đợt {c.phase}</span>
                              <span style={{ fontWeight: 700, color: c.status === 'paid' ? '#10b981' : c.status === 'cancelled' ? '#ef4444' : '#eab308' }}>
                                {formatCurrency(c.amount)} ({c.status === 'paid' ? '✅' : c.status === 'cancelled' ? '❌' : '⏳'})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 700 }}>Mô tả dự án</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--dt-light-text-secondary)', margin: 0 }}>
                      {selectedProject.description || '—'}
                    </p>
                  </div>

                  {/* Notes Timeline */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>📝 Lịch sử ghi chú ({selectedProject.notes?.length || 0})</h4>
                      <button
                        className="dash-btn dash-btn-outline dash-btn-sm"
                        onClick={() => { setAddNoteProject(selectedProject); setAddNoteText(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      >
                        <MessageSquare size={12} /> Thêm note
                      </button>
                    </div>
                    {(!selectedProject.notes || selectedProject.notes.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--dt-light-surface-2)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--dt-light-text-muted)' }}>
                        Chưa có ghi chú nào
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                        {[...selectedProject.notes].reverse().map((note, idx) => (
                          <div key={idx} style={{
                            padding: '10px 14px',
                            backgroundColor: note.statusChange?.to ? '#f0f9ff' : 'var(--dt-light-surface-2)',
                            borderRadius: '8px',
                            borderLeft: note.statusChange?.to ? '3px solid #3b82f6' : '3px solid var(--dt-light-border)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dt-light-text-muted)' }}>
                                {note.createdBy?.name || 'System'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--dt-light-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} /> {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.4, color: 'var(--dt-light-text)' }}>
                              {note.content}
                            </p>
                            {note.statusChange?.from && note.statusChange?.to && (
                              <div style={{ marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span className={`dash-badge ${PROJECT_STATUS[note.statusChange.from]?.color}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                  {PROJECT_STATUS[note.statusChange.from]?.label}
                                </span>
                                <span style={{ fontSize: '0.7rem' }}>→</span>
                                <span className={`dash-badge ${PROJECT_STATUS[note.statusChange.to]?.color}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                  {PROJECT_STATUS[note.statusChange.to]?.label}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--dt-light-border)', paddingTop: 'var(--space-4)' }}>
                    {selectedProject.status !== 'cancelled' && selectedProject.status !== 'completed' && (
                      <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => { setCancelModal(selectedProject); setSelectedProject(null); setCancelReason(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Ban size={14} /> Hủy dự án
                      </button>
                    )}
                    <button className="dash-btn dash-btn-outline" onClick={() => setSelectedProject(null)} style={{ marginLeft: 'auto' }}>Đóng</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {addNoteProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 'var(--space-4)' }}>
          <div className="dash-card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="dash-card-header" style={{ borderBottom: '1px solid var(--dt-light-border)' }}>
              <h3 className="dash-card-title" style={{ margin: 0 }}>📝 Thêm ghi chú - {addNoteProject.projectCode}</h3>
            </div>
            <div className="dash-card-body">
              <textarea
                className="dash-form-textarea"
                placeholder="Nội dung ghi chú..."
                value={addNoteText}
                onChange={(e) => setAddNoteText(e.target.value)}
                style={{ minHeight: '100px' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button className="dash-btn dash-btn-outline" onClick={() => setAddNoteProject(null)}>Hủy</button>
                <button className="dash-btn dash-btn-primary" disabled={!addNoteText.trim()} onClick={() => {
                  addNote(addNoteProject._id, addNoteText);
                  setAddNoteProject(null);
                }}>Thêm ghi chú</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
