# Security Specification: Multi-tenant Gated Gated-Society SaaS

This document defines the security parameters, data invariants, adversarial payloads ("Dirty Dozen"), and verification rules for the multi-tenant Apartment & Society Management Platform.

---

## 1. Data Invariants

1. **Tenant Isolation (Multi-Tenancy):** No data from one Society can ever be read, queried, or modified by a user (Resident, Guard, or Society Admin) from another Society.
2. **Role Hierarchy:** Only explicit roles can perform administrative operations:
   - `SUPER_ADMIN` can read and write all societies and all user records.
   - `SOCIETY_ADMIN` can read/write data only within their assigned `societyId`.
   - `SECURITY_GUARD` can perform gate logs and check-in tasks only inside their assigned `societyId`.
   - `RESIDENT` can access their own flat details, vehicle registries, and general society notifications, but cannot modify core settings or create blocks/flats.
3. **PII Protection:** User Private Info (`/users/{userId}/private/info`) containing email and phone numbers must only be readable by the owner (`userId == request.auth.uid`) or a Society/Super Admin.
4. **Verified Credentials:** All write operations require a verified email (`request.auth.token.email_verified == true`).
5. **Immutable Records:** High-integrity fields like `createdAt` and `societyId` must not be updated after creation.

---

## 2. The "Dirty Dozen" Adversarial Payloads
The following payloads are designed by a Red Team to breach identity, integrity, and SaaS isolation bounds. All of these payloads must be blocked and return `PERMISSION_DENIED`.

### Payload 1: Self-Promoted Super Admin
*Resident attempts to set their role to `SUPER_ADMIN` in their public profile.*
```json
// Path: /users/resident_uid_123/public/profile
{
  "uid": "resident_uid_123",
  "displayName": "John Doe",
  "role": "SUPER_ADMIN",
  "societyId": "soc_a_789",
  "createdAt": "2026-07-21T05:30:00Z"
}
```

### Payload 2: Cross-Tenant Data Injection
*An admin of Society A attempts to create a Flat under Society B's sub-collection.*
```json
// Path: /societies/society_B/flats/flat_101
{
  "id": "flat_101",
  "societyId": "society_A", // Conflict!
  "blockId": "block_y",
  "flatNumber": "101",
  "floor": 1,
  "status": "occupied",
  "createdAt": "2026-07-21T05:30:00Z"
}
```

### Payload 3: Unverified Email Tenant Creation
*A user with an unverified email attempts to register.*
```json
// Path: /users/unverified_uid/private/info
{
  "uid": "unverified_uid",
  "email": "unverified@example.com",
  "phoneNumber": "+1234567890",
  "isActive": true,
  "updatedAt": "2026-07-21T05:30:00Z"
}
// Request auth state has email_verified = false
```

### Payload 4: Invalid ID Poisoning (Path Injection)
*Attacker attempts to create a society with a massive/malicious ID string to break indexing.*
```json
// Path: /societies/soc_<<<<_INV_!!!!_>>>>_long_poison_string_here_over_128_bytes
{
  "id": "soc_<<<<_INV_!!!!_>>>>_long_poison_string_here_over_128_bytes",
  "name": "Poison Gated Community",
  "address": "123 Cyber Way",
  "city": "Metropolis",
  "state": "NY",
  "zipCode": "10001",
  "totalBlocks": 1,
  "totalFlats": 1,
  "contactEmail": "admin@poison.com",
  "contactPhone": "+123456",
  "subscriptionPlan": "free",
  "createdAt": "2026-07-21T05:30:00Z",
  "updatedAt": "2026-07-21T05:30:00Z"
}
```

### Payload 5: Resident Bypass of Settings Update
*Resident attempts to modify Society Settings to toggle guest self-check-in.*
```json
// Path: /societies/society_A/settings/config
{
  "societyId": "society_A",
  "allowGuestSelfCheckIn": true,
  "requireDeliveryOtp": false,
  "updatedAt": "2026-07-21T05:30:00Z"
}
```

### Payload 6: Modifying Immortal Creation Fields
*Resident attempts to re-assign a vehicle's owner and associated society to steal parking privileges.*
```json
// Path: /societies/society_A/vehicles/veh_444
// Existing data: { "societyId": "society_A", "ownerId": "resident_A", "vehicleNumber": "NY123" }
// Incoming Update:
{
  "societyId": "society_B", // Attempting to move across tenant
  "ownerId": "resident_B", // Attempting to change ownership
  "vehicleNumber": "NY123",
  "type": "FOUR_WHEELER",
  "makeModel": "Honda Accord",
  "color": "Black"
}
```

### Payload 7: Ghost Field Injection (Shadow Update)
*Attacker attempts to inject an undocumented/unvalidated field `shadowField` to bypass validation.*
```json
// Path: /societies/society_A/blocks/block_1
{
  "id": "block_1",
  "societyId": "society_A",
  "name": "Block C",
  "totalFloors": 12,
  "createdAt": "2026-07-21T05:30:00Z",
  "shadowField": "ghost_attacker_value" // Shadow Field!
}
```

### Payload 8: Blanket Scraper Query (No Tenant Constraints)
*A malicious resident attempts to run a blanket list query across all societies to harvest building rosters.*
```javascript
// Query:
db.collectionGroup('flats').get()
// Should fail because list operations must check tenant context inside resource.data or parent path.
```

### Payload 9: Client-Side Temporal Forgery
*Guard attempts to check in a visitor but sends a manual forged historical/future timestamp instead of Server Timestamp.*
```json
// Path: /societies/society_A/notifications/not_123
{
  "id": "not_123",
  "societyId": "society_A",
  "title": "Emergency Alert",
  "body": "False Alarm",
  "type": "emergency",
  "createdAt": "1999-12-31T23:59:59Z" // Forged timestamp, not request.time!
}
```

### Payload 10: Value Type Injection
*Attacker tries to inject array structure where an integer is expected.*
```json
// Path: /societies/society_A/blocks/block_2
{
  "id": "block_2",
  "societyId": "society_A",
  "name": "Block 2",
  "totalFloors": [99, "infinite"], // Int expected, Array injected!
  "createdAt": "2026-07-21T05:30:00Z"
}
```

### Payload 11: Cross-Tenant PII Harvesting
*A resident of Society B attempts to read `/users/resident_A/private/info` belonging to a resident of Society A.*
```javascript
// Request:
getDoc(doc(db, "users", "resident_A", "private", "info"))
// Auth User: resident_B, residing in society_B
// Result: PERMISSION_DENIED
```

### Payload 12: Denial of Wallet (DOW) String Bloating
*Attacker injects a 1.2MB JSON String into the society's zipCode.*
```json
// Path: /societies/society_A
{
  "zipCode": "10001............................ [1.2MB of dots]"
}
```

---

## 3. Test Runner Design

To test the security of these rules, we verify that:
1. `request.auth != null`
2. `request.auth.token.email_verified == true`
3. Document fields are validated against their lengths (`maxLength`) and allowed types.
4. Update operations specify strict field changes via `affectedKeys().hasOnly()`.
