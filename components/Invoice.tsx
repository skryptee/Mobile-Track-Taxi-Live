'use client';

import { forwardRef } from 'react';

interface InvoiceProps {
  booking: {
    bookingId: string;
    customerId: { name: string; phone: string; email?: string };
    driverId?: { name: string; phone: string; vehicleNumber: string; vehicleType: string };
    pickupLocation: string;
    dropoffLocation: string;
    vehicleType: string;
    acType: string;
    estimatedFare: number;
    finalFare?: number;
    baseFare?: number;
    distanceCharge?: number;
    actualDistance?: number;
    estimatedDistance?: number;
    status: string;
    pickupTime: string;
    completionTime?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    rating?: number;
    createdAt?: string;
  };
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGST?: string;
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ booking, companyName = 'Taxi Service', companyAddress, companyPhone, companyGST }, ref) => {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const fare = booking.finalFare || booking.estimatedFare;
    const distance = booking.actualDistance || booking.estimatedDistance || 0;

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-2xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{companyName}</h1>
          {companyAddress && <p className="text-sm mt-1">{companyAddress}</p>}
          {companyPhone && <p className="text-sm">Phone: {companyPhone}</p>}
          {companyGST && <p className="text-sm">GST: {companyGST}</p>}
        </div>

        {/* Invoice Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold border-2 border-black inline-block px-8 py-2">
            TAX INVOICE
          </h2>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm"><strong>Invoice No:</strong> INV-{booking.bookingId}</p>
            <p className="text-sm"><strong>Booking ID:</strong> {booking.bookingId}</p>
            <p className="text-sm"><strong>Date:</strong> {formatDate(booking.completionTime || booking.pickupTime)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm"><strong>Status:</strong> {booking.status.toUpperCase()}</p>
            <p className="text-sm"><strong>Payment:</strong> {(booking.paymentStatus || 'pending').toUpperCase()}</p>
            {booking.paymentMethod && (
              <p className="text-sm"><strong>Method:</strong> {booking.paymentMethod.toUpperCase()}</p>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="border border-black p-4 mb-6">
          <h3 className="font-bold text-sm uppercase mb-2 border-b border-black pb-1">Bill To</h3>
          <p className="text-sm"><strong>Name:</strong> {booking.customerId.name}</p>
          <p className="text-sm"><strong>Phone:</strong> {booking.customerId.phone}</p>
          {booking.customerId.email && (
            <p className="text-sm"><strong>Email:</strong> {booking.customerId.email}</p>
          )}
        </div>

        {/* Trip Details */}
        <div className="border border-black p-4 mb-6">
          <h3 className="font-bold text-sm uppercase mb-2 border-b border-black pb-1">Trip Details</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1"><strong>Pickup:</strong></td>
                <td className="py-1">{booking.pickupLocation}</td>
              </tr>
              <tr>
                <td className="py-1"><strong>Drop:</strong></td>
                <td className="py-1">{booking.dropoffLocation}</td>
              </tr>
              <tr>
                <td className="py-1"><strong>Vehicle:</strong></td>
                <td className="py-1">{booking.vehicleType.toUpperCase()} ({booking.acType.toUpperCase()})</td>
              </tr>
              <tr>
                <td className="py-1"><strong>Distance:</strong></td>
                <td className="py-1">{distance} KMs</td>
              </tr>
              <tr>
                <td className="py-1"><strong>Pickup Time:</strong></td>
                <td className="py-1">{formatDate(booking.pickupTime)}</td>
              </tr>
              {booking.completionTime && (
                <tr>
                  <td className="py-1"><strong>Completion:</strong></td>
                  <td className="py-1">{formatDate(booking.completionTime)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Driver Details */}
        {booking.driverId && (
          <div className="border border-black p-4 mb-6">
            <h3 className="font-bold text-sm uppercase mb-2 border-b border-black pb-1">Driver Details</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1"><strong>Name:</strong></td>
                  <td className="py-1">{booking.driverId.name}</td>
                </tr>
                <tr>
                  <td className="py-1"><strong>Phone:</strong></td>
                  <td className="py-1">{booking.driverId.phone}</td>
                </tr>
                <tr>
                  <td className="py-1"><strong>Vehicle No:</strong></td>
                  <td className="py-1">{booking.driverId.vehicleNumber}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Fare Breakdown */}
        <div className="border-2 border-black mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {booking.baseFare !== undefined && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4">Base Fare</td>
                  <td className="py-2 px-4 text-right">{booking.baseFare.toFixed(2)}</td>
                </tr>
              )}
              {booking.distanceCharge !== undefined && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4">Distance Charge ({distance} km)</td>
                  <td className="py-2 px-4 text-right">{booking.distanceCharge.toFixed(2)}</td>
                </tr>
              )}
              {!booking.baseFare && !booking.distanceCharge && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4">Trip Fare ({distance} km)</td>
                  <td className="py-2 px-4 text-right">{fare.toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-gray-100 font-bold">
                <td className="py-3 px-4">TOTAL</td>
                <td className="py-3 px-4 text-right text-lg">Rs. {fare.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-sm border-t border-black pt-4">
          <p className="mb-2">Thank you for traveling with us!</p>
          {booking.rating && (
            <p className="mb-2">Customer Rating: {'★'.repeat(booking.rating)}{'☆'.repeat(5 - booking.rating)}</p>
          )}
          <p className="text-xs text-gray-600">This is a computer-generated invoice.</p>
        </div>
      </div>
    );
  }
);

Invoice.displayName = 'Invoice';
