import express from "express";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

import {previewReservation,createReservation,getMyReservations,getReservationById,cancelReservation,updateReservation,} from "../Controllers/reservationController.js";

import {getCurrentStayDetails,createGuestServiceRequest,getMyServiceRequests,cancelMyServiceRequest,createFeedback,getMyFeedback,getMyFeedbackById,updateMyFeedback,deleteMyFeedback,updateHousekeepingRequestStatus,getPublicFeedback,} from "../Controllers/guestController.js";

const guestRoutes = express.Router();
guestRoutes.get("/public/feedback", getPublicFeedback);
guestRoutes.use(protect, authorizeRoles("guest"));
guestRoutes.get("/reservations/preview", previewReservation);
guestRoutes.post("/reservations", createReservation);
guestRoutes.get("/reservations", getMyReservations);
guestRoutes.get("/reservations/:id", getReservationById);
guestRoutes.put("/reservations/:id", updateReservation);
guestRoutes.patch("/reservations/:id/cancel", cancelReservation);
guestRoutes.get("/current-stay", getCurrentStayDetails);
guestRoutes.post("/service-requests", createGuestServiceRequest);
guestRoutes.get("/service-requests", getMyServiceRequests);
guestRoutes.patch("/service-requests/:serviceType/:id/cancel", cancelMyServiceRequest);
guestRoutes.post("/feedback", createFeedback);
guestRoutes.get("/feedback", getMyFeedback);
guestRoutes.get("/feedback/:id", getMyFeedbackById);
guestRoutes.put("/feedback/:id", updateMyFeedback);
guestRoutes.delete("/feedback/:id", deleteMyFeedback);

export default guestRoutes;