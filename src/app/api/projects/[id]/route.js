import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Commission from '@/lib/models/Commission';
import User from '@/lib/models/User';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const project = await Project.findById(id)
      .populate('ctvId', 'name email phone avatar bankName bankAccountNumber bankAccountName qrCodeImage')
      .populate('orderId', 'orderCode websiteType description ctvPhone')
      .populate('notes.createdBy', 'name email')
      .lean();

    if (!project) {
      return Response.json({ error: 'Dự án không tìm thấy' }, { status: 404 });
    }

    // Get related commissions
    const commissions = await Commission.find({ projectId: project._id })
      .populate('paidBy', 'name')
      .sort({ phase: 1 })
      .lean();

    return Response.json({ project, commissions });
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const {
      status, customerName, zaloGroupLink, contactLinks,
      contractValue, progress, noteContent, cancelReason
    } = body;

    const project = await Project.findById(id);
    if (!project) {
      return Response.json({ error: 'Dự án không tìm thấy' }, { status: 404 });
    }

    const admin = await User.findOne({ email: session.user.email });
    const previousStatus = project.status;

    // Update fields
    if (customerName !== undefined) project.customerName = customerName;
    if (zaloGroupLink !== undefined) project.zaloGroupLink = zaloGroupLink;
    if (contactLinks !== undefined) project.contactLinks = contactLinks;
    if (progress !== undefined) project.progress = progress;

    if (contractValue !== undefined) {
      project.contractValue = contractValue;
      // Pre-calculate to update commissions
      const commissionTotal = Math.round(contractValue * (project.commissionRate || 7) / 100);
      project.commissionTotal = commissionTotal;
      
      // Update pending commissions
      const existing = await Commission.find({ projectId: project._id });
      const phase1 = existing.find(c => c.phase === 1);
      const phase2 = existing.find(c => c.phase === 2);
      
      if (phase1) {
        if (phase1.status === 'pending') {
          const halfAmount = Math.round(commissionTotal / 2);
          phase1.amount = halfAmount;
          await phase1.save();
          
          if (phase2 && phase2.status === 'pending') {
            phase2.amount = commissionTotal - halfAmount;
            await phase2.save();
          }
        } else {
          // If phase 1 is paid, phase 2 (if pending) gets the remaining balance
          if (phase2 && phase2.status === 'pending') {
            phase2.amount = Math.max(0, commissionTotal - phase1.amount);
            await phase2.save();
          }
        }
      }
    }

    // Handle status change
    const targetStatus = status || previousStatus;
    if (status && status !== previousStatus) {
      project.status = status;

      // Add note for status change
      const statusLabels = {
        consulting: 'Đang tư vấn',
        contracted: 'Đã ký HĐ',
        in_progress: 'Đang triển khai',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
      };

      project.notes.push({
        content: noteContent || `Chuyển trạng thái: ${statusLabels[previousStatus]} → ${statusLabels[status]}`,
        createdBy: admin._id,
        createdAt: new Date(),
        statusChange: { from: previousStatus, to: status },
      });

      // Handle cancellation
      if (status === 'cancelled') {
        project.cancelledAt = new Date();
        project.cancelReason = cancelReason || '';
        
        // Cancel pending commissions
        await Commission.updateMany(
          { projectId: project._id, status: 'pending' },
          { status: 'cancelled' }
        );
      }
    } else if (noteContent) {
      // Add a note without status change
      project.notes.push({
        content: noteContent,
        createdBy: admin._id,
        createdAt: new Date(),
        statusChange: { from: null, to: null },
      });
    }

    // Sync commissions based on target project status
    if (project.commissionTotal > 0 && targetStatus !== 'cancelled') {
      const halfAmount = Math.round(project.commissionTotal / 2);
      
      if (targetStatus === 'consulting') {
        // Delete pending commissions if moved back to consulting
        await Commission.deleteMany({ projectId: project._id, status: 'pending' });
      } 
      else if (targetStatus === 'contracted' || targetStatus === 'in_progress') {
        // Ensure Phase 1 commission exists as pending
        const existingPhase1 = await Commission.findOne({ projectId: project._id, phase: 1 });
        if (!existingPhase1) {
          await Commission.create({
            orderId: project.orderId,
            projectId: project._id,
            orderCode: project.orderCode,
            projectCode: project.projectCode,
            ctvId: project.ctvId,
            phase: 1,
            amount: halfAmount,
            status: 'pending',
          });
        }
        // Delete pending Phase 2 commission if exists (not completed yet)
        await Commission.deleteMany({ projectId: project._id, phase: 2, status: 'pending' });
      } 
      else if (targetStatus === 'completed') {
        // Ensure Phase 1 commission exists
        const existingPhase1 = await Commission.findOne({ projectId: project._id, phase: 1 });
        if (!existingPhase1) {
          await Commission.create({
            orderId: project.orderId,
            projectId: project._id,
            orderCode: project.orderCode,
            projectCode: project.projectCode,
            ctvId: project.ctvId,
            phase: 1,
            amount: halfAmount,
            status: 'pending',
          });
        }
        // Ensure Phase 2 commission exists
        const existingPhase2 = await Commission.findOne({ projectId: project._id, phase: 2 });
        if (!existingPhase2) {
          await Commission.create({
            orderId: project.orderId,
            projectId: project._id,
            orderCode: project.orderCode,
            projectCode: project.projectCode,
            ctvId: project.ctvId,
            phase: 2,
            amount: project.commissionTotal - (existingPhase1 ? existingPhase1.amount : halfAmount),
            status: 'pending',
          });
        }
      }
    }

    await project.save();

    // Re-fetch with populated fields
    const updated = await Project.findById(id)
      .populate('ctvId', 'name email phone avatar')
      .populate('notes.createdBy', 'name email')
      .lean();

    return Response.json({ project: updated, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
