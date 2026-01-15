import httpStatus from 'http-status-codes';;
import Property from './properties.model.js';
import AppError from '../../errorHelpers/AppError.js';
import mongoose from 'mongoose';

const createProperty = async (payload, userId) => {
  const { images, ...rest } = payload;

  // Check if property with same title exists for this owner
  const existingProperty = await Property.findOne({
    title: rest.title,
    owner: userId,
    isDeleted: false
  });

  if (existingProperty) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a property with this title'
    );
  }

  // Upload images to Cloudinary

  // Create property
  const property = await Property.create({
    ...rest,
    images: images || [],
    owner: userId,
    status: 'active'
  });

  return property;
};

const getAllProperties = async (filters, paginationOptions) => {
  const { search, city, type, listingType, minPrice, maxPrice, minBedrooms, featured, status, owner, isDeleted } = filters;

  const { page, limit, sortBy, sortOrder } = paginationOptions;

  const query = { isDeleted: false };

  if (isDeleted) {
    query.isDeleted = true
  }

  // Search by title or description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by city
  if (city) {
    query.city = city;
  }

  // Filter by property type
  if (type) {
    query.type = type;
  }

  // Filter by listing type
  if (listingType) {
    query.listingType = listingType;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Filter by bedrooms
  if (minBedrooms) {
    query.bedrooms = { $gte: Number(minBedrooms) };
  }

  // Filter by featured status
  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by owner
  if (owner) {
    query.owner = owner;
  }

  // Pagination
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortConditions = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortConditions.createdAt = -1; // Default sort by newest
  }

  console.log(query)
  const properties = await Property.find(query)
    .populate('owner', 'name email phone avatar')
    .sort(sortConditions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Property.countDocuments(query);

  return {
    properties,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

const getPropertyById = async (id) => {
  const property = await Property.findById(id)
    .populate('owner', 'name email phone avatar company')
    .lean();

  if (!property || property.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found');
  }

  return property;
};

const updateProperty = async (id, payload, userId) => {
  const property = await Property.findById(id);

  if (!property || property.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found');
  }

  // Check ownership
  if (property.owner.toString() !== userId.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this property');
  }

  Object.assign(property, payload);
  await property.save();

  return property;
};

const deleteProperty = async (id, userId, permanent = false) => {
  const property = await Property.findById(id);

  if (!property || (property.isDeleted && !permanent)) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found');
  }

  // Check ownership
  if (property.owner.toString() !== userId.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this property');
  }

  if (permanent) {

    await Property.findByIdAndDelete(id);
  } else {
    // Soft delete
    property.isDeleted = true;
    property.deletedAt = new Date();
    property.status = 'inactive';
    await property.save();
  }

  return property;
};

const getMyProperties = async (userId, filters, paginationOptions) => {
  return getAllProperties(
    { ...filters, owner: userId },
    paginationOptions
  );
};

const toggleFeatured = async (id, userId, featured) => {
  const property = await Property.findById(id);

  if (!property || property.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found');
  }

  // Check ownership
  if (property.owner.toString() !== userId.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to modify this property');
  }

  property.featured = featured;

  // Set expiration date for featured status (30 days from now)
  if (featured) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    property.featuredExpiresAt = expiresAt;
  } else {
    property.featuredExpiresAt = null;
  }

  await property.save();
  return property;
};

const updateStatus = async (id, userId, status) => {
  const property = await Property.findById(id);

  if (!property || property.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Property not found');
  }

  // Check ownership
  if (property.owner.toString() !== userId.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to modify this property');
  }

  property.status = status;
  await property.save();

  return property;
};

const getPropertyStats = async (userId) => {

  const stats = await Property.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalProperties: { $sum: 1 },
        totalForRent: {
          $sum: { $cond: [{ $eq: ['$listingType', 'rent'] }, 1, 0] }
        },
        totalForSale: {
          $sum: { $cond: [{ $eq: ['$listingType', 'sale'] }, 1, 0] }
        },
        totalFeatured: {
          $sum: { $cond: ['$featured', 1, 0] }
        },
        totalActive: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        avgPrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' }
      }
    },
    {
      $project: {
        _id: 0,
        totalProperties: 1,
        totalForRent: 1,
        totalForSale: 1,
        totalFeatured: 1,
        totalActive: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        maxPrice: 1,
        minPrice: 1
      }
    }
  ]);

  return stats[0] || {
    totalProperties: 0,
    totalForRent: 0,
    totalForSale: 0,
    totalFeatured: 0,
    totalActive: 0,
    avgPrice: 0,
    maxPrice: 0,
    minPrice: 0
  };
};

export const propertiesServices = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
  toggleFeatured,
  updateStatus,
  getPropertyStats
};