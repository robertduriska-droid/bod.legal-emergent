# Implementation Progress Notes

## Current State (July 11, 2026)
- 45 tests passing, 0 TS errors
- Persist decisions: DONE (schema, DB helpers, tRPC procedures, frontend integration)
- Remaining: Email notifications, Admin lawyer review dashboard, Side-by-side comparison

## Key References

### Owner Notifications API
- File: references/owner-notifications.md
- Uses: server/_core/notification.ts → notifyOwner(title, body, options)
- For in-app notifications: use createNotification() from server/db.ts

### Admin Procedures Pattern
- File: server/routers.ts has `adminProcedure` (line ~4 import)
- Pattern: protectedProcedure.use(({ ctx, next }) => { if (ctx.user.role !== 'admin') throw FORBIDDEN; return next({ ctx }); })
- User table has `role` field: enum('user', 'admin')

### Contract Status Flow
- pending → analyzing → in_review → completed
- updateContractStatus(id, status) in server/db.ts

### Clauses Table Fields for Lawyer Review
- lawyerAnnotation: text (added during review)
- lawyerApproved: int (0/1)
- overriddenRiskLevel: enum('high', 'medium', 'low')
- updateClause(id, data) in server/db.ts

### Reports Table Fields
- isSigned: int (0/1)
- signedAt: timestamp
- lawyerName: varchar(256)
- lawyerId: int
- updateReport(contractId, data) in server/db.ts

### Gaps to Fix
1. Add error handling to decision mutations (onError rollback, toast)
2. Add ownership validation in decisions procedures (verify contract belongs to user)
3. These can be addressed alongside the three new features

### Side-by-Side Comparison
- Currently Report.tsx has inline redline view (showRedline state)
- Need to add a second mode: side-by-side (two columns)
- Toggle between: inline redline | side-by-side | off

### Email/Notification Flow
- When analysis completes (in server/analysis.ts or wherever status changes to completed):
  - createNotification() for in-app bell
  - notifyOwner() for push to admin
- The notification bell component already exists and is translated
