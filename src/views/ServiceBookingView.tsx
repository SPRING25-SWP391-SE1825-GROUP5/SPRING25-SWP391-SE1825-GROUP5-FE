import React from 'react'
import { ServiceBookingForm } from '@/components/booking'
import './service-booking.scss'

const ServiceBookingView: React.FC = () => {
  return (
    <div className="service-booking-view booking-page">
      <ServiceBookingForm />
    </div>
  )
}

export default ServiceBookingView

