# Database Models Documentation

## Overview
This document describes the database schema for the Electric Vehicle Service Management System. The database contains tables for managing users, service centers, vehicles, bookings, work orders, inventory, and billing.

## Core Models

### User Management

#### Users
Central user table for authentication and basic information.
- **UserID** (PK): Auto-increment primary key
- **Username**: Unique username (50 chars)
- **Email**: Unique email address (100 chars)
- **PasswordHash**: Hashed password (255 chars)
- **FullName**: User's full name (100 chars)
- **PhoneNumber**: Phone number (20 chars)
- **DateOfBirth**: Date of birth
- **Address**: User address (255 chars)
- **Gender**: Male/Female (6 chars)
- **AvatarUrl**: Profile picture URL (500 chars)
- **Role**: User role (20 chars)
- **IsActive**: Active status flag
- **EmailVerified**: Email verification status
- **PhoneVerified**: Phone verification status
- **CreatedAt**: Creation timestamp
- **UpdatedAt**: Last update timestamp
- **RefreshToken**: JWT refresh token storage

#### Customers
Customer-specific information extending Users.
- **CustomerID** (PK): Auto-increment primary key
- **UserID** (FK): Reference to Users table
- **CustomerCode**: Unique customer code (20 chars)
- **NormalizedPhone**: Normalized phone for search (20 chars)
- **IsGuest**: Guest customer flag
- **CreatedAt**: Creation timestamp
- **UpdatedAt**: Last update timestamp

#### Staff
Staff member information for service centers.
- **StaffID** (PK): Auto-increment primary key
- **UserID** (FK): Reference to Users table
- **CenterID** (FK): Reference to ServiceCenters
- **StaffCode**: Unique staff code (20 chars)
- **Position**: Job position (50 chars)
- **HireDate**: Employment start date
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

#### Technicians
Technician-specific information and skills.
- **TechnicianID** (PK): Auto-increment primary key
- **UserID** (FK): Reference to Users table
- **CenterID** (FK): Reference to ServiceCenters
- **TechnicianCode**: Unique technician code (20 chars)
- **Specialization**: Technical specialization (100 chars)
- **ExperienceYears**: Years of experience
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

### Service Management

#### ServiceCenters
Physical service center locations.
- **CenterID** (PK): Auto-increment primary key
- **CenterName**: Center name (100 chars)
- **Address**: Physical address (255 chars)
- **City**: City location (50 chars)
- **PhoneNumber**: Contact phone (20 chars)
- **Email**: Contact email (100 chars)
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

#### ServiceCategories
Hierarchical service categorization.
- **CategoryID** (PK): Auto-increment primary key
- **CategoryName**: Category name (100 chars)
- **Description**: Category description (255 chars)
- **IsActive**: Active status
- **ParentCategoryID** (FK): Parent category reference

#### Services
Individual service offerings.
- **ServiceID** (PK): Auto-increment primary key
- **CategoryID** (FK): Reference to ServiceCategories
- **ServiceName**: Service name (100 chars)
- **Description**: Service description (500 chars)
- **EstimatedDuration**: Duration in minutes
- **RequiredSlots**: Number of time slots needed
- **BasePrice**: Base service price
- **RequiredSkills**: Required technician skills (255 chars)
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

#### ServicePackages
Bundled service offerings.
- **PackageID** (PK): Auto-increment primary key
- **PackageCode**: Unique package code (50 chars)
- **PackageName**: Package name (200 chars)
- **Description**: Package description (500 chars)
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

#### ServicePackageItems
Services included in packages.
- **PackageID** (FK): Reference to ServicePackages
- **ServiceID** (FK): Reference to Services
- **Quantity**: Service quantity in package
- **SortOrder**: Display order

### Vehicle Management

#### VehicleModels
Electric vehicle model specifications.
- **ModelID** (PK): Auto-increment primary key
- **Brand**: Vehicle brand (50 chars)
- **ModelName**: Model name (100 chars)
- **Year**: Manufacturing year
- **BatteryCapacity**: Battery capacity in kWh
- **Range**: Electric range in km
- **CreatedAt**: Creation timestamp

#### Vehicles
Customer vehicle records.
- **VehicleID** (PK): Auto-increment primary key
- **CustomerID** (FK): Reference to Customers
- **ModelID** (FK): Reference to VehicleModels
- **VIN**: Vehicle identification number (17 chars)
- **LicensePlate**: License plate number (20 chars)
- **Color**: Vehicle color (30 chars)
- **CurrentMileage**: Current odometer reading
- **LastServiceDate**: Last service date
- **NextServiceDue**: Next service due date
- **CreatedAt**: Creation timestamp

### Scheduling

#### TimeSlots
Available time slots for bookings.
- **SlotID** (PK): Auto-increment primary key
- **SlotTime**: Time of day
- **SlotLabel**: Display label (20 chars)
- **IsActive**: Active status

#### TechnicianTimeSlots
Technician availability tracking.
- **TechnicianSlotID** (PK): Auto-increment primary key
- **TechnicianID** (FK): Reference to Technicians
- **WorkDate**: Work date
- **SlotID** (FK): Reference to TimeSlots
- **IsAvailable**: Availability flag
- **IsBooked**: Booking status
- **BookingID** (FK): Reference to Bookings
- **Notes**: Additional notes (255 chars)
- **CreatedAt**: Creation timestamp

### Booking & Work Orders

#### Bookings
Service appointment bookings.
- **BookingID** (PK): Auto-increment primary key
- **BookingCode**: Unique booking code (20 chars)
- **CustomerID** (FK): Reference to Customers
- **VehicleID** (FK): Reference to Vehicles
- **CenterID** (FK): Reference to ServiceCenters
- **BookingDate**: Appointment date
- **StartSlotID** (FK): Start time slot
- **EndSlotID** (FK): End time slot
- **Status**: Booking status (PENDING/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED)
- **TotalEstimatedCost**: Estimated total cost
- **SpecialRequests**: Special requirements (500 chars)
- **CreatedAt**: Creation timestamp
- **UpdatedAt**: Last update timestamp
- **TotalSlots**: Calculated total slots

#### BookingServices
Services included in bookings.
- **BookingID** (FK): Reference to Bookings
- **ServiceID** (FK): Reference to Services
- **Quantity**: Service quantity
- **UnitPrice**: Price per unit
- **TotalPrice**: Total line price

#### BookingTimeSlots
Time slot assignments for bookings.
- **BookingID** (FK): Reference to Bookings
- **SlotID** (FK): Reference to TimeSlots
- **TechnicianID** (FK): Reference to Technicians
- **SlotOrder**: Sequence order

#### WorkOrders
Actual work execution records.
- **WorkOrderID** (PK): Auto-increment primary key
- **WorkOrderNumber**: Unique work order number (20 chars)
- **BookingID** (FK): Reference to Bookings
- **TechnicianID** (FK): Reference to Technicians
- **Status**: Work order status (NOT_STARTED/IN_PROGRESS/COMPLETED/ON_HOLD)
- **StartTime**: Actual start time
- **EndTime**: Actual end time
- **ActualDuration**: Actual duration in minutes
- **InitialMileage**: Starting odometer reading
- **FinalMileage**: Ending odometer reading
- **CustomerComplaints**: Customer reported issues
- **WorkPerformed**: Description of work completed
- **CreatedAt**: Creation timestamp
- **UpdatedAt**: Last update timestamp

#### WorkOrderParts
Parts used in work orders.
- **WorkOrderID** (FK): Reference to WorkOrders
- **PartID** (FK): Reference to Parts
- **QuantityUsed**: Quantity consumed
- **UnitCost**: Cost per unit
- **TotalCost**: Total part cost

### Inventory Management

#### Parts
Spare parts and components catalog.
- **PartID** (PK): Auto-increment primary key
- **PartNumber**: Unique part number (50 chars)
- **PartName**: Part name (100 chars)
- **Brand**: Part brand (50 chars)
- **UnitPrice**: Price per unit
- **Unit**: Unit of measure (20 chars)
- **IsActive**: Active status
- **CreatedAt**: Creation timestamp

#### Warehouses
Storage locations for parts.
- **WarehouseID** (PK): Auto-increment primary key
- **CenterID** (FK): Reference to ServiceCenters
- **Code**: Warehouse code (50 chars)
- **Name**: Warehouse name (200 chars)
- **IsActive**: Active status

#### InventoryBalances
Current stock levels by warehouse.
- **PartID** (FK): Reference to Parts
- **WarehouseID** (FK): Reference to Warehouses
- **Quantity**: Current stock quantity

#### InventoryTransactions
Stock movement history.
- **TransactionID** (PK): Auto-increment primary key
- **PartID** (FK): Reference to Parts
- **WarehouseID** (FK): Reference to Warehouses
- **QtyChange**: Quantity change (+ or -)
- **RefType**: Reference type (WORKORDER/SALE/TRANSFER_IN/TRANSFER_OUT)
- **RefID**: Reference ID
- **CreatedAt**: Transaction timestamp

#### InventoryTransfers
Inter-warehouse transfers.
- **TransferID** (PK): Auto-increment primary key
- **FromWarehouseID** (FK): Source warehouse
- **ToWarehouseID** (FK): Destination warehouse
- **Status**: Transfer status (DRAFT/POSTED)
- **CreatedAt**: Creation timestamp
- **PostedAt**: Posted timestamp
- **Note**: Transfer notes (500 chars)

#### InventoryTransferItems
Items in transfers.
- **TransferID** (FK): Reference to InventoryTransfers
- **PartID** (FK): Reference to Parts
- **Quantity**: Transfer quantity

### Billing & Payments

#### Invoices
Service billing invoices.
- **InvoiceID** (PK): Auto-increment primary key
- **InvoiceNumber**: Unique invoice number (20 chars)
- **WorkOrderID** (FK): Reference to WorkOrders
- **CustomerID** (FK): Reference to Customers
- **BillingName**: Billing contact name (200 chars)
- **BillingPhone**: Billing phone (20 chars)
- **BillingAddress**: Billing address (255 chars)
- **Status**: Invoice status (DRAFT/SENT/PAID/OVERDUE/CANCELLED)
- **TotalAmount**: Total invoice amount
- **CreatedAt**: Creation timestamp
- **InvoiceType**: Type (STANDARD/SUPPLEMENTAL)
- **ParentInvoiceID** (FK): Parent invoice for supplements

#### InvoiceItems
Line items on invoices.
- **InvoiceItemID** (PK): Auto-increment primary key
- **InvoiceID** (FK): Reference to Invoices
- **PartID** (FK): Reference to Parts (nullable for labor)
- **Description**: Item description (300 chars)
- **Quantity**: Item quantity
- **UnitPrice**: Price per unit
- **LineTotal**: Total line amount

#### Payments
Payment processing records.
- **PaymentID** (PK): Auto-increment primary key
- **PaymentCode**: Unique payment code (50 chars)
- **InvoiceID** (FK): Reference to Invoices
- **PayOSOrderCode**: PayOS integration order code
- **Amount**: Payment amount
- **Status**: Payment status (PENDING/PAID/CANCELLED/EXPIRED)
- **BuyerName**: Buyer name (100 chars)
- **BuyerPhone**: Buyer phone (20 chars)
- **BuyerAddress**: Buyer address (255 chars)
- **CreatedAt**: Creation timestamp
- **PaidAt**: Payment completion timestamp

#### InvoicePayments
Payment applications to invoices.
- **InvoiceID** (FK): Reference to Invoices
- **PaymentID** (FK): Reference to Payments
- **AppliedAmount**: Amount applied to invoice

### Sales Management

#### SalesOrders
Direct parts sales orders.
- **SalesOrderID** (PK): Auto-increment primary key
- **CustomerID** (FK): Reference to Customers
- **CenterID** (FK): Reference to ServiceCenters
- **ChannelID** (FK): Reference to Channels
- **WarehouseID** (FK): Reference to Warehouses
- **Status**: Order status (PENDING/PAID)
- **CreatedAt**: Creation timestamp

#### SalesOrderItems
Items in sales orders.
- **SalesOrderID** (FK): Reference to SalesOrders
- **PartID** (FK): Reference to Parts
- **Quantity**: Order quantity
- **UnitPrice**: Price per unit

#### Channels
Sales channels for tracking.
- **ChannelID** (PK): Auto-increment primary key
- **Code**: Channel code (20 chars)
- **Name**: Channel name (100 chars)

### Promotions & Discounts

#### Promotions
Promotional campaigns and discounts.
- **PromotionID** (PK): Auto-increment primary key
- **Code**: Promotion code (30 chars)
- **Description**: Promotion description (500 chars)
- **DiscountValue**: Discount amount or percentage
- **DiscountType**: Type (PERCENT/AMOUNT)
- **MinOrderAmount**: Minimum order for discount
- **StartDate**: Promotion start date
- **EndDate**: Promotion end date
- **MaxDiscount**: Maximum discount amount
- **Status**: Promotion status (DRAFT/ACTIVE/PAUSED/EXPIRED)
- **UsageLimit**: Maximum total uses
- **UsageCount**: Current usage count
- **UserLimit**: Uses per customer
- **PromotionType**: Type (PUBLIC/PRIVATE/VOUCHER/AUTO)
- **ApplyFor**: Application scope (ORDER/SERVICE/CATEGORY/CUSTOMER/CENTER)
- **CreatedAt**: Creation timestamp
- **UpdatedAt**: Last update timestamp

#### UserPromotions
Customer promotion usage tracking.
- **UserPromotionID** (PK): Auto-increment primary key
- **CustomerID** (FK): Reference to Customers
- **PromotionID** (FK): Reference to Promotions
- **InvoiceID** (FK): Reference to Invoices
- **UsedAt**: Usage timestamp
- **DiscountAmount**: Applied discount amount
- **Status**: Usage status (USED/PENDING/VOID)

### System Features

#### Notifications
User notification system.
- **NotificationID** (PK): Auto-increment primary key
- **UserID** (FK): Reference to Users
- **Title**: Notification title (255 chars)
- **Message**: Notification content
- **Type**: Notification type (20 chars)
- **IsRead**: Read status
- **ReadAt**: Read timestamp
- **CreatedAt**: Creation timestamp

#### OTPCodes
One-time password management.
- **OTPID** (PK): Auto-increment primary key
- **UserID** (FK): Reference to Users
- **OTPCode**: 6-digit code
- **OTPType**: Purpose type (20 chars)
- **ContactInfo**: Email/phone for delivery (100 chars)
- **ExpiresAt**: Expiration timestamp
- **IsUsed**: Usage status
- **UsedAt**: Usage timestamp
- **AttemptCount**: Verification attempts
- **CreatedAt**: Creation timestamp

#### SystemSettings
Application configuration.
- **SettingKey**: Setting identifier (100 chars)
- **SettingValue**: Setting value
- **Description**: Setting description (255 chars)
- **UpdatedAt**: Last update timestamp

### Maintenance Features

#### MaintenanceReminders
Vehicle maintenance scheduling.
- **ReminderID** (PK): Auto-increment primary key
- **VehicleID** (FK): Reference to Vehicles
- **ServiceType**: Type of maintenance (100 chars)
- **DueMileage**: Mileage when due
- **DueDate**: Date when due
- **IsCompleted**: Completion status
- **CompletedAt**: Completion timestamp
- **CreatedAt**: Creation timestamp

#### MaintenanceChecklists
Service completion checklists.
- **ChecklistID** (PK): Auto-increment primary key
- **WorkOrderID** (FK): Reference to WorkOrders
- **CreatedAt**: Creation timestamp
- **Notes**: Additional notes (500 chars)

#### MaintenanceChecklistItems
Standard checklist items.
- **ItemID** (PK): Auto-increment primary key
- **ItemName**: Item name (200 chars)
- **Description**: Item description (500 chars)

#### MaintenanceChecklistResults
Checklist completion results.
- **ChecklistID** (FK): Reference to MaintenanceChecklists
- **ItemID** (FK): Reference to MaintenanceChecklistItems
- **Performed**: Whether item was performed
- **Result**: Result of check (50 chars)
- **Comment**: Additional comments (250 chars)

### HR Features

#### LeaveRequests
Technician leave management.
- **RequestID** (PK): Auto-increment primary key
- **TechnicianID** (FK): Reference to Technicians
- **LeaveType**: Type of leave (20 chars)
- **StartDate**: Leave start date
- **EndDate**: Leave end date
- **TotalDays**: Total leave days
- **Reason**: Leave reason (500 chars)
- **Status**: Request status (PENDING/APPROVED/REJECTED)
- **ApprovedBy** (FK): Approving user reference
- **ApprovedAt**: Approval timestamp
- **Comments**: Approval comments (255 chars)
- **CreatedAt**: Creation timestamp

### Charge Proposals

#### WorkOrderChargeProposals
Additional charge proposals for work orders.
- **ProposalID** (PK): Auto-increment primary key
- **WorkOrderID** (FK): Reference to WorkOrders
- **Status**: Proposal status (PENDING/APPROVED)
- **CreatedAt**: Creation timestamp
- **ApprovedAt**: Approval timestamp
- **ApprovedBy**: Approving person (100 chars)
- **Note**: Proposal notes (500 chars)

#### WorkOrderChargeProposalItems
Items in charge proposals.
- **ProposalItemID** (PK): Auto-increment primary key
- **ProposalID** (FK): Reference to WorkOrderChargeProposals
- **PartID** (FK): Reference to Parts (nullable for labor)
- **Description**: Item description (200 chars)
- **Quantity**: Item quantity
- **UnitPrice**: Price per unit

## Views

### vw_Available_Seats
Shows available seats for movie showtimes (appears to be from a different system - likely template remnant).

## Stored Procedures

### sp_Invoice_CreateSupplementalFromProposal
Creates supplemental invoices from approved charge proposals.

### sp_Sales_ConfirmPaid
Confirms payment for sales orders and updates inventory.

### sp_Transfer_Post
Posts inventory transfers between warehouses.

### sp_WO_ApproveProposal
Approves work order charge proposals.

### sp_WO_CreateProposal
Creates new work order charge proposals.

### sp_WorkOrder_ConsumeParts
Consumes parts from inventory for work orders.

## Key Business Rules

1. **User Management**: Users can have multiple roles (Customer, Staff, Technician) through separate tables
2. **Booking Flow**: Booking → WorkOrder → Invoice → Payment
3. **Inventory Control**: All inventory movements tracked through transactions
4. **Time Slots**: Bookings span multiple time slots with technician assignments
5. **Billing**: Supports standard and supplemental invoices with charge proposals
6. **Promotions**: Flexible promotion system with usage tracking
7. **Maintenance**: Automated reminders and structured checklists

## Database Constraints

- All monetary values use DECIMAL(12,2) or DECIMAL(10,2)
- Phone numbers normalized for search efficiency
- Unique constraints on business codes (BookingCode, WorkOrderNumber, etc.)
- Check constraints ensure data integrity (positive quantities, valid statuses)
- Foreign key relationships maintain referential integrity
