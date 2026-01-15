import mongoose from "mongoose";
import AppError from "../../errorHelpers/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { User } from "../auth/auth.model.js";
import Property from "../properties/properties.model.js";
import Lease from "./lease.model.js";
import httpStatus from "http-status-codes";

// Create new lease (Draft)
const createLease = catchAsync(async (req, res) => {
  const { propertyId, tenantId, startDate, endDate, rentAmount, terms, customClauses } = req.body;
  
  // Verify property belongs to landlord
  const property = await Property.findOne({
    _id: propertyId,
    owner: req.user.userId,
    isDeleted: false
  });
  
  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found or unauthorized');
  }
  
  // Verify tenant exists
  const tenant = await User.findById(tenantId);
  if (!tenant || tenant.role !== 'tenant') {
    throw new AppError(httpStatus.NOT_FOUND, 'Tenant not found');
  }
  
  // Create lease draft
  const lease = await Lease.create({
    title: `Lease Agreement for ${property.title}`,
    description: `Lease between ${req.user.name} and ${tenant.name}`,
    landlord: req.user.userId,
    tenant: tenantId,
    property: propertyId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    rentAmount,
    rentFrequency: req.body.rentFrequency || 'monthly',
    securityDeposit: req.body.securityDeposit || 0,
    terms: terms || {},
    customClauses: customClauses || [],
    status: 'draft',
    createdBy: req.user.userId,
    statusHistory: [{
      status: 'draft',
      changedBy: req.user.userId,
      reason: 'Lease created as draft'
    }]
  });
  
  // Populate references
  const populatedLease = await Lease.findById(lease._id)
    .populate('property', 'title address city type')
    .populate('landlord', 'name email phone')
    .populate('tenant', 'name email phone');
  
  res.status(201).json({
    success: true,
    message: 'Lease created as draft',
    data: populatedLease
  });
});

// Send lease to tenant
const sendToTenant = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  const { message } = req.body;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    landlord: req.user.userId,
    status: 'draft'
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found or unauthorized');
  }
  
  // Update status
  lease.status = 'sent_to_tenant';
  
  // Add message
  if (message) {
    lease.messages.push({
      from: req.user.userId,
      message,
      sentAt: new Date()
    });
  }
  
  await lease.save();
  
  // Send notification to tenant
  const tenant = await User.findById(lease.tenant);
  if (tenant) {
    // send email notification
  }
  
  res.status(200).json({
    success: true,
    message: 'Lease sent to tenant',
    data: lease
  });
});

// Request changes to lease
const requestChanges = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  const { changes } = req.body;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    $or: [
      { landlord: req.user.userId },
      { tenant: req.user.userId }
    ]
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found');
  }
  
  // Check if user can request changes
  if (lease.status !== 'sent_to_tenant' && lease.status !== 'changes_requested') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot request changes in current status');
  }
  
  // Update status
  lease.status = 'changes_requested';
  
  // Add change request
  lease.requestedChanges.push({
    requestedBy: req.user.userId,
    changes,
    requestedAt: new Date()
  });
  
  // Add message
  lease.messages.push({
    from: req.user.userId,
    message: `Requested changes: ${changes}`,
    sentAt: new Date()
  });
  
  await lease.save();
  
  // Notify other party
  const otherPartyId = req.user.userId.toString() === lease.landlord.toString() 
    ? lease.tenant 
    : lease.landlord;
  
  const otherUser = await User.findById(otherPartyId);
  if (otherUser) {
    // send notification about requested changes
  }
  
  res.status(200).json({
    success: true,
    message: 'Changes requested successfully',
    data: lease
  });
});

// Update lease (landlord edits after changes requested)
const updateLease = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  const updates = req.body;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    landlord: req.user.userId,
    status: 'changes_requested'
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found or unauthorized to edit');
  }
  
  // Update lease fields
  const allowedUpdates = ['title', 'description', 'startDate', 'endDate', 
                         'rentAmount', 'rentFrequency', 'securityDeposit', 
                         'terms', 'customClauses'];
  
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      lease[field] = updates[field];
    }
  });
  
  // Mark requested changes as resolved
  if (updates.resolutionNotes) {
    const unresolvedChanges = lease.requestedChanges.filter(rc => !rc.resolved);
    unresolvedChanges.forEach(rc => {
      rc.resolved = true;
      rc.resolvedAt = new Date();
      rc.resolutionNotes = updates.resolutionNotes;
    });
  }
  
  // Update status back to sent_to_tenant
  lease.status = 'sent_to_tenant';
  
  // Add message
  lease.messages.push({
    from: req.user.userId,
    message: updates.message || 'Lease updated and resent',
    sentAt: new Date()
  });
  
  await lease.save();
  
  // Notify tenant
  const tenant = await User.findById(lease.tenant);
  if (tenant) {
    // send notification about updated lease
  }
  
  res.status(200).json({
    success: true,
    message: 'Lease updated successfully',
    data: lease
  });
});

// Sign lease with simple signature
const signLease = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  const { singnatureImageUrl } = req.body;
  
  const lease = await Lease.findById(leaseId);
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found');
  }
  
  // Check if lease is expired
  if (lease.expiresAt && new Date() > lease.expiresAt) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This lease has expired');
  }
  
  // Check if user is party to the lease
  const isLandlord = lease.landlord.toString() === req.user.userId.toString();
  const isTenant = lease.tenant.toString() === req.user.userId.toString();
  
  if (!isLandlord && !isTenant) {
    throw new AppError(httpStatus.FORBIDDEN, 'Not authorized to sign this lease');
  }
  
  const role = isLandlord ? 'landlord' : 'tenant';
  
  // Check if already signed
  if (lease.signatures[role]?.signedAt) {
    throw new AppError(httpStatus.BAD_REQUEST, `Already signed as ${role}`);
  }
  
  
  // Save signature
  lease.signatures[role] = {
    signedAt: new Date(),
    signatureData: validation.data,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    singnatureImageUrl: singnatureImageUrl,
  };
  
  // Update status based on signing order
  if (role === 'landlord') {
    lease.status = 'signed_by_landlord';
  } else if (role === 'tenant' && !lease.signatures.landlord?.signedAt) {
    // Tenant signing first (unusual but possible)
    lease.status = 'signed_by_tenant';
  } else if (lease.signatures.landlord?.signedAt && lease.signatures.tenant?.signedAt) {
    lease.status = 'fully_executed';
    // generate pdf or final document if needed
  }
  
  // Add message
  lease.messages.push({
    from: req.user.userId,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} signed the lease`,
    sentAt: new Date()
  });
  
  await lease.save();
  
  // Send notification to other party if one has signed
  const otherPartyId = role === 'landlord' ? lease.tenant : lease.landlord;
  const otherUser = await User.findById(otherPartyId);
  
  if (otherUser) {
    // send notification about signing
  }
  
  res.status(200).json({
    success: true,
    message: 'Lease signed successfully',
    data: {
      leaseId: lease._id,
      role,
      signedAt: lease.signatures[role].signedAt,
      verificationToken,
      status: lease.status,
      nextAction: lease.nextAction
    }
  });
});



// Get leases for current user
const getMyLeases = catchAsync(async (req, res) => {
  const { status, role } = req.query;
  const userId = req.user.userId;
  
  let query = {
    $or: [
      { landlord: userId },
      { tenant: userId }
    ],
    isDeleted: false
  };
  
  // Filter by role if specified
  if (role === 'landlord') {
    query = { landlord: userId, isDeleted: false };
  } else if (role === 'tenant') {
    query = { tenant: userId, isDeleted: false };
  }
  
  // Filter by status if specified
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const leases = await Lease.find(query)
    .populate('property', 'title address city type')
    .populate('landlord', 'name email')
    .populate('tenant', 'name email')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    message: 'Leases retrieved successfully',
    data: leases,
    count: leases.length
  });
});

// Get lease by ID
const getLeaseById = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    $or: [
      { landlord: req.user.userId },
      { tenant: req.user.userId }
    ],
    isDeleted: false
  })
  .populate('property', 'title address city state zipCode type amenities')
  .populate('landlord', 'name email phone profilePicture')
  .populate('tenant', 'name email phone profilePicture')
  .populate('createdBy', 'name email')
  .populate('statusHistory.changedBy', 'name email')
  .populate('customClauses.addedBy', 'name email')
  .populate('messages.from', 'name email profilePicture')
  .populate('requestedChanges.requestedBy', 'name email');
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found');
  }
  
  res.status(200).json({
    success: true,
    message: 'Lease retrieved successfully',
    data: lease
  });
});

// Cancel lease
const cancelLease = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  const { reason } = req.body;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    $or: [
      { landlord: req.user.userId },
      { tenant: req.user.userId }
    ],
    status: { $nin: ['fully_executed', 'cancelled', 'expired'] }
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found or cannot be cancelled');
  }
  
  // Update status
  lease.status = 'cancelled';
  
  // Add message
  lease.messages.push({
    from: req.user.userId,
    message: `Lease cancelled. Reason: ${reason || 'No reason provided'}`,
    sentAt: new Date()
  });
  
  await lease.save();
  
  // Notify other party
  const otherPartyId = req.user.userId.toString() === lease.landlord.toString() 
    ? lease.tenant 
    : lease.landlord;
  
  const otherUser = await User.findById(otherPartyId);
  if (otherUser) {
    // send notification about lease cancellation
  }
  
  res.status(200).json({
    success: true,
    message: 'Lease cancelled successfully',
    data: lease
  });
});


// Get lease statistics
const getLeaseStats = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  const stats = await Lease.aggregate([
    {
      $match: {
        $or: [
          { landlord: mongoose.Types.ObjectId(userId) },
          { tenant: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRent: { $sum: '$rentAmount' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        totalRent: 1,
        _id: 0
      }
    }
  ]);
  
  // Get counts by role
  const asLandlord = await Lease.countDocuments({
    landlord: userId,
    isDeleted: false
  });
  
  const asTenant = await Lease.countDocuments({
    tenant: userId,
    isDeleted: false
  });
  
  // Get expiring soon leases (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringSoon = await Lease.countDocuments({
    $or: [
      { landlord: userId },
      { tenant: userId }
    ],
    status: 'fully_executed',
    endDate: {
      $gte: new Date(),
      $lte: thirtyDaysFromNow
    },
    isDeleted: false
  });
  
  res.status(200).json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: {
      byStatus: stats,
      counts: {
        total: asLandlord + asTenant,
        asLandlord,
        asTenant
      },
      expiringSoon
    }
  });
});

// Soft delete lease (archive)
const deleteLease = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    $or: [
      { landlord: req.user.userId },
      { tenant: req.user.userId }
    ],
    status: { $in: ['draft', 'cancelled', 'expired'] }
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Lease not found or cannot be deleted');
  }
  
  lease.isDeleted = true;
  lease.deletedAt = new Date();
  
  await lease.save();
  
  res.status(200).json({
    success: true,
    message: 'Lease deleted successfully',
    data: { leaseId, deletedAt: new Date() }
  });
});

// Restore deleted lease
const restoreLease = catchAsync(async (req, res) => {
  const { leaseId } = req.params;
  
  const lease = await Lease.findOne({
    _id: leaseId,
    $or: [
      { landlord: req.user.userId },
      { tenant: req.user.userId }
    ],
    isDeleted: true
  });
  
  if (!lease) {
    throw new AppError(httpStatus.NOT_FOUND, 'Deleted lease not found');
  }
  
  lease.isDeleted = false;
  lease.deletedAt = undefined;
  
  await lease.save();
  
  res.status(200).json({
    success: true,
    message: 'Lease restored successfully',
    data: lease
  });
});


export {
  createLease,
  sendToTenant,
  requestChanges,
  updateLease,
  signLease,
  getMyLeases,
  getLeaseById,
  cancelLease,
  getLeaseStats,
  deleteLease,
  restoreLease,
};