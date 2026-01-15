import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Property Classification
  type: {
    type: String,
    required: true,
    enum: ['villa', 'condo', 'house', 'apartment', 'studio', 'land'],
    default: 'villa'
  },
  
  listingType: {
    type: String,
    required: true,
    enum: ['rent', 'sale'],
    default: 'rent'
  },
  
  // Price Information
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  pricePeriod: {
    type: String,
    enum: ['night', 'week', 'month', 'year', null],
    default: 'night'
  },
  
  // Property Details
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative'],
    max: [50, 'Maximum 50 bedrooms allowed']
  },
  
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative'],
    max: [50, 'Maximum 50 bathrooms allowed']
  },
  
  area: {
    type: Number,
    min: [0, 'Area cannot be negative']
  },
  
  areaUnit: {
    type: String,
    enum: ['sqft', 'sqm', 'acre', null],
    default: 'sqft'
  },
  
  // Location
  city: {
    type: String,
    required: [true, 'City is required'],
    enum: [
      'Punta Cana', 'Bavaro', 'Cap Cana', 'Macao', 
      'Uvero Alto', 'Cabeza de Toro', 'Cortecito'
    ],
    default: 'Punta Cana'
  },
  
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  
  // Coordinates (Optional - for future map features)
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  
  // Images
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String 
    },
    isCover: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Featured Status
  featured: {
    type: Boolean,
    default: false
  },
  
  featuredExpiresAt: {
    type: Date
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'sold', 'rented'],
    default: 'active'
  },
  
  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Amenities (Optional - for future expansion)
  amenities: [{
    type: String,
    enum: [
      'pool', 'gym', 'parking', 'wifi', 'ac', 'heating',
      'kitchen', 'tv', 'washer', 'dryer', 'security',
      'elevator', 'balcony', 'garden', 'beach_access',
      'concierge', 'spa', 'tennis_court', 'bbq_area'
    ]
  }],
  
  // Availability (for rentals)
  availability: {
    startDate: Date,
    endDate: Date,
    minimumStay: {
      type: Number,
      default: 1
    },
    maximumStay: {
      type: Number
    }
  },
  
  // Additional Details
  yearBuilt: {
    type: Number,
    min: [1800, 'Year built must be realistic'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  
  floors: {
    type: Number,
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for price display
propertySchema.virtual('displayPrice').get(function() {
  if (this.listingType === 'rent') {
    const periodMap = {
      'night': '/night',
      'week': '/week',
      'month': '/month',
      'year': '/year'
    };
    return `$${this.price}${periodMap[this.pricePeriod] || ''}`;
  }
  return `$${this.price}`;
});

// Virtual for area display
propertySchema.virtual('displayArea').get(function() {
  if (!this.area) return null;
  const unitMap = {
    'sqft': 'sq ft',
    'sqm': 'sq m',
    'acre': 'acres'
  };
  return `${this.area} ${unitMap[this.areaUnit] || ''}`;
});

// Indexes for better query performance
propertySchema.index({ owner: 1, status: 1 });
propertySchema.index({ city: 1, type: 1, price: 1 });
propertySchema.index({ featured: 1, status: 1 });
propertySchema.index({ location: '2dsphere' }); // For geospatial queries

// Middleware to update updatedAt before save
propertySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Static method to find active properties
propertySchema.statics.findActive = function() {
  return this.find({ status: 'active', isDeleted: false });
};

// Method to check if property is available
propertySchema.methods.isAvailable = function(checkIn, checkOut) {
  if (this.listingType !== 'rent') return true;
  
  if (!this.availability) return true;
  
  const { startDate, endDate } = this.availability;
  if (!startDate || !endDate) return true;
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  return checkInDate >= startDate && checkOutDate <= endDate;
};

const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);

export default Property;