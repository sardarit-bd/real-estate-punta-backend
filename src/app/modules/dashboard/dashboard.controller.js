import { dashboardService } from "./dashboard.service.js";

export const getDashboard = async (req, res) => {
  const { role, userId } = req.user;

  let data;

  switch (role) {
    case 'admin':
      data = await dashboardService.getAdminDashboard();
      break;

    case 'owner':
      data = await dashboardService.getOwnerDashboard(userId);
      break;

    case 'tenant':
      data = await dashboardService.getTenantDashboard(userId);
      break;

    default:
      throw new Error('Invalid role');
  }

  res.status(200).json({
    success: true,
    data,
  });
};
