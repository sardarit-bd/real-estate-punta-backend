import { User } from "../auth/auth.model.js";
import Lease from "../lease/lease.model.js";
import Property from "../properties/properties.model.js";

const getOwnerDashboard = async (ownerId) => {
    const totalProperties = await Property.countDocuments({ owner: ownerId });
    const activeProperties = await Property.countDocuments({ owner: ownerId, status: 'active' });
    const featuredProperties = await Property.countDocuments({ owner: ownerId, featured: true });

    const totalRevenueAgg = await Payment.aggregate([
        { $match: { owner: ownerId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const recentProperties = await Property.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title price featured status');

    const recentPayments = await Payment.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('amount status createdAt property');

    return {
        role: 'owner',
        stats: {
            totalProperties,
            activeProperties,
            featuredProperties,
            totalRevenue,
        },
        recentProperties,
        recentPayments,
    };
};

const getTenantDashboard = async (tenantId) => {
    const activeLeases = await Lease.countDocuments({
        tenant: tenantId,
        status: 'fully_executed',
    });

    return {
        role: 'tenant',
        stats: {
            activeLeases,
        },
    };
};

const getAdminDashboard = async () => {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalLeases = await Lease.countDocuments();

    return {
        role: 'admin',
        stats: {
            totalUsers,
            totalProperties,
            totalLeases,
        },
    };
};

export const dashboardService = {
    getAdminDashboard,
    getOwnerDashboard,
    getTenantDashboard,
};
