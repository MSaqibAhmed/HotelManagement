import Room from "../Models/roomModel.js";
import Reservation from "../Models/reservationModel.js";
import Invoice from "../Models/billingModel.js";
import User from "../Models/userModel.js";
import HousekeepingTask from "../Models/housekeepingModel.js";
import MaintenanceRequest from "../Models/maintenanceRequestModel.js";

export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;

    if (["admin", "manager", "receptionist"].includes(role)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayBooking = await Reservation.countDocuments({ createdAt: { $gte: today } });
      const totalCustomer = await User.countDocuments({ role: "guest" });

      const totalRevenueAgg = await Invoice.aggregate([
        { $match: { status: { $in: ["Paid", "PartiallyPaid"] } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" }, sumTotal: { $sum: "$totalAmount" } } }
      ]);
      const totalAmount = totalRevenueAgg[0]?.sumTotal || 0;
      const totalRevenue = totalRevenueAgg[0]?.total || 0;
      const recentBookings = await Reservation.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("guest", "name email");

      const tableData = await Promise.all(recentBookings.map(async (r) => {
        const invoice = await Invoice.findOne({ reservation: r._id });
        const totalAmt = r.payment?.amount || 0;
        const paidAmt = invoice?.status === "Paid" ? invoice.paidAmount : invoice?.paidAmount || 0;
        const dueAmt = Math.max(0, totalAmt - paidAmt);
        
        return {
          id: r._id,
          name: r.guest?.name || r.guestSnapshot?.name || "Unknown",
          room: r.roomType,
          checkIn: new Date(r.checkInDate).toLocaleDateString("en-GB"),
          checkOut: new Date(r.checkOutDate).toLocaleDateString("en-GB"),
          method: invoice?.method || r.payment?.method || "Cash",
          amount: `Rs. ${totalAmt.toLocaleString()}`,
          paid: `Rs. ${paidAmt.toLocaleString()}`,
          due: `Rs. ${dueAmt.toLocaleString()}`,
          status: invoice?.status === "Paid" || r.payment?.status === "Paid" ? "Success" : "Pending",
        };
      }));
      const chartData = [];
      const labels = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const count = await Reservation.countDocuments({
          createdAt: { $gte: d, $lt: nextD }
        });

        chartData.push(count);
        labels.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
      }

      return res.status(200).json({
        success: true,
        stats: {
          todayBooking,
          totalAmount: `Rs. ${totalAmount}`,
          totalCustomer: totalCustomer >= 1000 ? `${(totalCustomer / 1000).toFixed(1)}k` : totalCustomer.toString(),
          totalRevenue: `Rs. ${totalRevenue}`
        },
        chartData,
        labels,
        tableData
      });
    }

    if (role === "housekeeping") {
      const pendingTasks = await HousekeepingTask.countDocuments({ status: "Pending" });
      const inProgressTasks = await HousekeepingTask.countDocuments({ status: "InProgress" });
      const completedTasks = await HousekeepingTask.countDocuments({ status: { $in: ["Completed", "Verified"] } });
      const totalTasks = await HousekeepingTask.countDocuments();

      const myTasks = await HousekeepingTask.find({ assignedTo: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("room");

      const tableData = myTasks.map(t => ({
        id: t._id,
        name: t.taskNumber,
        room: t.room?.roomNumber || t.roomSnapshot?.roomNumber || "N/A",
        checkIn: "N/A",
        checkOut: "N/A",
        paid: t.taskType,
        due: t.priority,
        status: t.status === "Completed" ? "Success" : "Pending",
      }));

      return res.status(200).json({
        success: true,
        stats: {
          todayBooking: pendingTasks,
          totalAmount: inProgressTasks.toString(),
          totalCustomer: completedTasks.toString(),
          totalRevenue: totalTasks.toString()
        },
        chartData: [],
        labels: [],
        tableData
      });
    }

    if (role === "maintenance") {
      const pendingRequests = await MaintenanceRequest.countDocuments({ status: "Pending" });
      const inProgressRequests = await MaintenanceRequest.countDocuments({ status: "In-Progress" });
      const completedRequests = await MaintenanceRequest.countDocuments({ status: "Completed" });
      const totalRequests = await MaintenanceRequest.countDocuments();

      const myRequests = await MaintenanceRequest.find({ assignedTo: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("room");

      const tableData = myRequests.map(r => ({
        id: r._id,
        name: r.requestNumber,
        room: r.room?.roomNumber || "N/A",
        checkIn: "N/A",
        checkOut: "N/A",
        paid: r.category,
        due: r.priority,
        status: r.status === "Completed" ? "Success" : "Pending",
      }));

      return res.status(200).json({
        success: true,
        stats: {
          todayBooking: pendingRequests,
          totalAmount: inProgressRequests.toString(),
          totalCustomer: completedRequests.toString(),
          totalRevenue: totalRequests.toString()
        },
        chartData: [],
        labels: [],
        tableData
      });
    }

    return res.status(403).json({ success: false, message: "Role not supported for dashboard" });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching dashboard stats", error: error.message });
  }
};
