// WhatsApp Web Integration using wa.me links
// No third-party APIs required - opens WhatsApp Web directly

export interface BookingInfo {
  bookingId: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  acType: string;
  fare: number;
  distance?: number;
  pickupTime?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleModel?: string;
  rating?: number;
}

export interface TripCompletionInfo {
  bookingId: string;
  totalKms: number;
  baseFare: number;
  perKmCharge: number;
  totalFare: number;
  pickupLocation: string;
  dropoffLocation: string;
}

export interface CancellationInfo {
  bookingId: string;
  reason: string;
  cancelledBy: 'customer' | 'driver' | 'admin';
  penalty?: number;
  refundAmount?: number;
}

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
}

// Generate WhatsApp Web link
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  const intlPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${intlPhone}?text=${encodedMessage}`;
}

// 1. Booking Created - Initial notification
export function generateBookingCreatedMessage(booking: BookingInfo, customer: CustomerInfo): string {
  const pickupTime = booking.pickupTime 
    ? new Date(booking.pickupTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'To be confirmed';
  
  return `Hello ${customer.name},

Your taxi booking has been received!

*Booking ID:* ${booking.bookingId}
*Pickup:* ${booking.pickupLocation}
*Drop:* ${booking.dropoffLocation}
*Vehicle:* ${booking.vehicleType.toUpperCase()} (${booking.acType.toUpperCase()})
*Pickup Time:* ${pickupTime}
${booking.distance ? `*Estimated Distance:* ${booking.distance} KMs` : ''}
*Estimated Fare:* Rs.${booking.fare}

We will confirm your booking shortly and assign a driver.

Thank you for choosing our service!`;
}




//driver message

export function generateDriverStatusMessage(
  booking: any,
  customer: any,
  driver: any,
  status: string
) {
  return `
🚖 Trip Update: ${status.toUpperCase()}

Booking ID: ${booking.bookingId}

👤 Customer: ${customer.name}
📞 Phone: ${customer.phone}

📍 Pickup: ${booking.pickupLocation}
🏁 Drop: ${booking.dropoffLocation}

🚗 Vehicle: ${driver.vehicleType} (${driver.vehicleNumber})

💰 Fare: Rs.${booking.estimatedFare}

🕒 Time: ${new Date(booking.pickupTime).toLocaleString()}

-------------------------
Please proceed accordingly.
`;
}

// 2. Booking Confirmed
export function generateBookingConfirmedMessage(booking: BookingInfo, customer: CustomerInfo): string {
  const pickupTime = booking.pickupTime 
    ? new Date(booking.pickupTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'As scheduled';

  return `Hello ${customer.name},

Your booking has been *CONFIRMED*! ✅

*Booking ID:* ${booking.bookingId}
*Pickup:* ${booking.pickupLocation}
*Drop:* ${booking.dropoffLocation}
*Vehicle:* ${booking.vehicleType.toUpperCase()} (${booking.acType.toUpperCase()})
*Pickup Time:* ${pickupTime}
${booking.distance ? `*Estimated Distance:* ${booking.distance} KMs` : ''}
*Estimated Fare:* Rs.${booking.fare}

A driver will be assigned to you shortly.

For any queries, please contact us.`;
}

// 3. Driver Assigned
export function generateDriverAssignedMessage(
  booking: BookingInfo, 
  customer: CustomerInfo, 
  driver: DriverInfo
): string {
  const pickupTime = booking.pickupTime 
    ? new Date(booking.pickupTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'As scheduled';

  return `Hello ${customer.name},

A driver has been assigned for your trip! 🚗

*Booking ID:* ${booking.bookingId}

━━━ *DRIVER DETAILS* ━━━
👤 Name: ${driver.name}
📞 Phone: ${driver.phone}
🚗 Vehicle: ${driver.vehicleType.toUpperCase()}${driver.vehicleModel ? ` (${driver.vehicleModel})` : ''}
🔢 Vehicle No: ${driver.vehicleNumber}
${driver.rating ? `⭐ Rating: ${driver.rating}/5` : ''}

━━━ *TRIP DETAILS* ━━━
📍 Pickup: ${booking.pickupLocation}
🎯 Drop: ${booking.dropoffLocation}
🕐 Pickup Time: ${pickupTime}
💰 Estimated Fare: Rs.${booking.fare}

Your driver will contact you before pickup.
Have a safe journey!`;
}

// 4. Driver Arrived
export function generateDriverArrivedMessage(
  booking: BookingInfo,
  customer: CustomerInfo,
  driver: DriverInfo,
  otp?: string
): string {
  return `Hello ${customer.name},

Your driver has *ARRIVED*! 🚗

*Booking ID:* ${booking.bookingId}

*Driver:* ${driver.name}
*Phone:* ${driver.phone}
*Vehicle No:* ${driver.vehicleNumber}

📍 *Pickup Location:* ${booking.pickupLocation}
${otp ? `\n🔐 *OTP for verification:* ${otp}\nPlease share this OTP with the driver.` : ''}

Please meet your driver at the pickup point.`;
}

// 5. Trip Started
export function generateTripStartedMessage(
  booking: BookingInfo, 
  customer: CustomerInfo, 
  driver: DriverInfo
): string {
  return `Hello ${customer.name},

Your trip has *STARTED*! 🚀

*Booking ID:* ${booking.bookingId}

*Driver:* ${driver.name}
*Phone:* ${driver.phone}
*Vehicle No:* ${driver.vehicleNumber}

*From:* ${booking.pickupLocation}
*To:* ${booking.dropoffLocation}

Have a safe and comfortable journey!`;
}

// 6. Trip Completed with Fare Breakdown
export function generateTripCompletedMessage(
  tripInfo: TripCompletionInfo,
  customer: CustomerInfo,
  driver: DriverInfo
): string {
  return `Hello ${customer.name},

Your trip has been *COMPLETED*! ✅

*Booking ID:* ${tripInfo.bookingId}

━━━ *TRIP SUMMARY* ━━━
📍 From: ${tripInfo.pickupLocation}
🎯 To: ${tripInfo.dropoffLocation}
📏 Total Distance: ${tripInfo.totalKms} KMs

━━━ *FARE BREAKDOWN* ━━━
Base Fare: Rs.${tripInfo.baseFare}
Distance Charge (${tripInfo.totalKms} km): Rs.${tripInfo.perKmCharge}
━━━━━━━━━━━━━━━━━━━━
*TOTAL FARE: Rs.${tripInfo.totalFare}*

*Driver:* ${driver.name}

Thank you for traveling with us! 🙏
We hope you had a pleasant journey.

📝 Please rate your experience!`;
}

// 7. Booking Cancelled
export function generateBookingCancelledMessage(
  booking: BookingInfo, 
  customer: CustomerInfo, 
  cancellation: CancellationInfo
): string {
  const cancelledByText = {
    customer: 'as per your request',
    driver: 'by the driver',
    admin: 'by the admin'
  };

  return `Hello ${customer.name},

Your booking has been *CANCELLED* ${cancelledByText[cancellation.cancelledBy]}.

*Booking ID:* ${cancellation.bookingId}
*From:* ${booking.pickupLocation}
*To:* ${booking.dropoffLocation}
*Reason:* ${cancellation.reason}
${cancellation.penalty ? `\n⚠️ *Cancellation Penalty:* Rs.${cancellation.penalty}` : ''}
${cancellation.refundAmount ? `\n💰 *Refund Amount:* Rs.${cancellation.refundAmount}` : ''}

If you did not request this cancellation, please contact us immediately.

We hope to serve you again soon.`;
}

// 8. Payment Reminder
export function generatePaymentReminderMessage(
  booking: BookingInfo,
  customer: CustomerInfo,
  amount: number,
  paymentMethod?: string
): string {
  return `Hello ${customer.name},

This is a reminder for your pending payment.

*Booking ID:* ${booking.bookingId}
*Trip:* ${booking.pickupLocation} → ${booking.dropoffLocation}
*Amount Due:* Rs.${amount}
${paymentMethod ? `*Payment Method:* ${paymentMethod.toUpperCase()}` : ''}

Please complete your payment at your earliest convenience.

Thank you!`;
}

// 9. Rating Request
export function generateRatingRequestMessage(
  booking: BookingInfo,
  customer: CustomerInfo,
  driver: DriverInfo,
  ratingLink?: string
): string {
  return `Hello ${customer.name},

Thank you for your recent trip!

*Booking ID:* ${booking.bookingId}
*Driver:* ${driver.name}
*Trip:* ${booking.pickupLocation} → ${booking.dropoffLocation}

We would love to hear your feedback! 📝

Please rate your experience:
⭐⭐⭐⭐⭐

${ratingLink ? `Rate here: ${ratingLink}` : 'Reply with a rating from 1-5 stars.'}

Your feedback helps us improve our service!`;
}

// 10. Recurring Booking Reminder
export function generateRecurringReminderMessage(
  booking: BookingInfo,
  customer: CustomerInfo,
  nextBookingDate: string
): string {
  return `Hello ${customer.name},

This is a reminder for your recurring booking!

*Route:* ${booking.pickupLocation} → ${booking.dropoffLocation}
*Next Trip:* ${nextBookingDate}
*Vehicle:* ${booking.vehicleType.toUpperCase()} (${booking.acType.toUpperCase()})
*Estimated Fare:* Rs.${booking.fare}

Reply *YES* to confirm this booking.
Reply *SKIP* to skip this trip.
Reply *STOP* to cancel recurring bookings.

Thank you!`;
}

// 11. Admin New Booking Alert
export function generateAdminNewBookingAlert(
  booking: BookingInfo,
  customer: CustomerInfo
): string {
  const pickupTime = booking.pickupTime 
    ? new Date(booking.pickupTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'ASAP';

  return `🚨 *NEW BOOKING ALERT*

*Booking ID:* ${booking.bookingId}

*Customer:* ${customer.name}
*Phone:* ${customer.phone}

*Pickup:* ${booking.pickupLocation}
*Drop:* ${booking.dropoffLocation}
*Vehicle:* ${booking.vehicleType.toUpperCase()} (${booking.acType.toUpperCase()})
*Pickup Time:* ${pickupTime}
${booking.distance ? `*Distance:* ${booking.distance} KMs` : ''}
*Fare:* Rs.${booking.fare}

Please assign a driver and confirm this booking.`;
}

// 12. Driver Notification - New Trip Assigned
export function generateDriverNewTripMessage(
  booking: BookingInfo,
  customer: CustomerInfo,
  driver: DriverInfo
): string {
  const pickupTime = booking.pickupTime 
    ? new Date(booking.pickupTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'ASAP';

  return `Hello ${driver.name},

You have a *NEW TRIP* assigned!

*Booking ID:* ${booking.bookingId}

*Customer:* ${customer.name}
*Phone:* ${customer.phone}

*Pickup:* ${booking.pickupLocation}
*Drop:* ${booking.dropoffLocation}
*Pickup Time:* ${pickupTime}
${booking.distance ? `*Distance:* ~${booking.distance} KMs` : ''}
*Fare:* Rs.${booking.fare}

Please contact the customer and reach the pickup location on time.

Safe driving!`;
}

// Calculate fare based on fare config
export function calculateFare(
  distance: number,
  fareConfig: {
    baseRate: number;
    perKmRate: number;
    minimumFare: number;
  }
): {
  baseFare: number;
  perKmCharge: number;
  totalFare: number;
} {
  const perKmCharge = distance * fareConfig.perKmRate;
  const calculatedFare = fareConfig.baseRate + perKmCharge;
  const totalFare = Math.max(calculatedFare, fareConfig.minimumFare);
  
  return {
    baseFare: fareConfig.baseRate,
    perKmCharge: Math.round(perKmCharge),
    totalFare: Math.round(totalFare),
  };
}

// Open WhatsApp with message
export function openWhatsApp(phoneNumber: string, message: string): void {
  const link = generateWhatsAppLink(phoneNumber, message);
  if (typeof window !== 'undefined') {
    window.open(link, '_blank');
  }
}

// Legacy function for backward compatibility
export function createWhatsAppNotificationLink(phoneNumber: string, message: string): string {
  return generateWhatsAppLink(phoneNumber, message);
}
