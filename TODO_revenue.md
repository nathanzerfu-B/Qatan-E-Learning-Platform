# TODO: Implement Real Total Revenue from Database

## Current State Analysis
- **Backend**: Analytics API already fetches total revenue from Transaction table with `status: "completed"`
- **Frontend**: Falls back to dummy calculation `courses.reduce((sum, c) => sum + ((c.price || 0) * (c.enrollments || 0)), 0)`
- **Database**: Transaction table exists with amount, status, courseId fields

## Issues Identified
1. **Frontend fallback is incorrect**: Uses `c.enrollments || 0` but enrollments is an array, should be `c.enrollments?.length || 0`
2. **Backend query is correct**: Already sums completed transactions properly
3. **Fallback logic**: Frontend should trust backend API more, but has safety fallback

## Required Changes

### 1. Frontend Fix
- [ ] Update fallback calculation to use `c.enrollments?.length || 0` instead of `c.enrollments || 0`

### 2. Backend Verification
- [ ] Confirm Transaction query is working correctly
- [ ] Ensure proper error handling for missing data

### 3. Testing
- [ ] Test with real transaction data
- [ ] Verify fallback works when API fails
- [ ] Check edge cases (no transactions, failed transactions, etc.)

## Expected Behavior
- Primary: Use `analytics.totalRevenue` from API (real transaction data)
- Fallback: Calculate from course prices * enrollment counts (dummy data)
- Handle missing/null data gracefully
