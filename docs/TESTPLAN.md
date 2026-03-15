# Test Plan — Student Account Management System

## Overview

This test plan covers all business logic from the legacy COBOL application (`main.cob`, `operations.cob`, `data.cob`). It is intended for validation with business stakeholders and will serve as the basis for unit and integration tests in the Node.js migration.

**System Under Test:** Account Management System  
**Initial Balance:** 1,000.00  
**Balance Format:** Up to 999,999.99 with 2 decimal places (`PIC 9(6)V99`)

---

## 1. Unit Tests — Data Layer (DataProgram)

These tests validate the in-memory data store that handles reading and writing the account balance.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| DL-001 | Read initial balance | Application just started; no operations performed | 1. Call DataProgram with operation `READ` | Balance returned is `1000.00` | | | Validates default initial state |
| DL-002 | Write and read back balance | Application just started | 1. Call DataProgram with operation `WRITE` and balance `2500.50` 2. Call DataProgram with operation `READ` | Balance returned is `2500.50` | | | Validates write persistence in memory |
| DL-003 | Overwrite balance with new value | Balance was previously written as `2500.50` | 1. Call DataProgram with operation `WRITE` and balance `750.00` 2. Call DataProgram with operation `READ` | Balance returned is `750.00` | | | Validates that writes fully replace the stored value |
| DL-004 | Read with zero balance | Balance was set to `0.00` | 1. Call DataProgram with operation `WRITE` and balance `0.00` 2. Call DataProgram with operation `READ` | Balance returned is `0.00` | | | Edge case: zero balance |
| DL-005 | Write maximum balance | Application started | 1. Call DataProgram with operation `WRITE` and balance `999999.99` 2. Call DataProgram with operation `READ` | Balance returned is `999999.99` | | | Boundary: max value for PIC 9(6)V99 |

---

## 2. Unit Tests — Operations Layer (Operations)

These tests validate the business logic for viewing, crediting, and debiting the account.

### 2.1 View Balance (TOTAL)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| OP-001 | View initial balance | No prior operations; balance is `1000.00` | 1. Call Operations with `TOTAL` | Displays `Current balance: 001000.00` | | | Default starting balance |
| OP-002 | View balance after credit | Balance was credited to `1500.00` | 1. Call Operations with `TOTAL` | Displays `Current balance: 001500.00` | | | Confirms balance reflects prior credit |
| OP-003 | View balance after debit | Balance was debited to `800.00` | 1. Call Operations with `TOTAL` | Displays `Current balance: 000800.00` | | | Confirms balance reflects prior debit |
| OP-004 | View zero balance | Balance is `0.00` | 1. Call Operations with `TOTAL` | Displays `Current balance: 000000.00` | | | Edge case |

### 2.2 Credit Account (CREDIT)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| OP-101 | Credit a standard amount | Balance is `1000.00` | 1. Call Operations with `CREDIT` 2. Enter amount `500.00` | Balance becomes `1500.00`; displays `Amount credited. New balance: 001500.00` | | | Basic credit operation |
| OP-102 | Credit a small amount (cents) | Balance is `1000.00` | 1. Call Operations with `CREDIT` 2. Enter amount `0.01` | Balance becomes `1000.01`; displays `Amount credited. New balance: 001000.01` | | | Minimum meaningful credit |
| OP-103 | Credit zero amount | Balance is `1000.00` | 1. Call Operations with `CREDIT` 2. Enter amount `0.00` | Balance remains `1000.00`; displays `Amount credited. New balance: 001000.00` | | | No-op credit; balance unchanged |
| OP-104 | Multiple sequential credits | Balance is `1000.00` | 1. Credit `200.00` 2. Credit `300.00` 3. Credit `500.00` | Balance becomes `2000.00` after all credits | | | Cumulative credits |
| OP-105 | Credit that approaches max balance | Balance is `999000.00` | 1. Call Operations with `CREDIT` 2. Enter amount `999.99` | Balance becomes `999999.99` | | | Boundary: reaches max PIC 9(6)V99 |

### 2.3 Debit Account (DEBIT)

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| OP-201 | Debit a standard amount | Balance is `1000.00` | 1. Call Operations with `DEBIT` 2. Enter amount `200.00` | Balance becomes `800.00`; displays `Amount debited. New balance: 000800.00` | | | Basic debit operation |
| OP-202 | Debit exact full balance | Balance is `1000.00` | 1. Call Operations with `DEBIT` 2. Enter amount `1000.00` | Balance becomes `0.00`; displays `Amount debited. New balance: 000000.00` | | | Boundary: debit equals balance exactly |
| OP-203 | Debit more than balance (insufficient funds) | Balance is `1000.00` | 1. Call Operations with `DEBIT` 2. Enter amount `1000.01` | Displays `Insufficient funds for this debit.`; balance remains `1000.00` | | | **Key business rule**: no negative balances |
| OP-204 | Debit with zero balance | Balance is `0.00` | 1. Call Operations with `DEBIT` 2. Enter amount `1.00` | Displays `Insufficient funds for this debit.`; balance remains `0.00` | | | Cannot debit from empty account |
| OP-205 | Debit zero amount | Balance is `1000.00` | 1. Call Operations with `DEBIT` 2. Enter amount `0.00` | Balance remains `1000.00`; displays `Amount debited. New balance: 001000.00` | | | No-op debit; condition `BALANCE >= AMOUNT` is true |
| OP-206 | Debit a small amount (cents) | Balance is `1000.00` | 1. Call Operations with `DEBIT` 2. Enter amount `0.01` | Balance becomes `999.99`; displays `Amount debited. New balance: 000999.99` | | | Minimum meaningful debit |
| OP-207 | Multiple sequential debits | Balance is `1000.00` | 1. Debit `200.00` 2. Debit `300.00` 3. Debit `400.00` | Balance becomes `100.00` after all debits | | | Cumulative debits |
| OP-208 | Debit fails after prior debits exhaust funds | Balance is `1000.00` | 1. Debit `999.00` (succeeds, balance `1.00`) 2. Debit `5.00` | Second debit displays `Insufficient funds for this debit.`; balance stays `1.00` | | | Validates running balance check |

---

## 3. Integration Tests — End-to-End Workflows

These tests validate complete user workflows through the menu system, combining multiple operations.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| IT-001 | Full workflow: view, credit, debit, view | Fresh start; balance `1000.00` | 1. Select option 1 (View Balance) 2. Select option 2 (Credit) → enter `500.00` 3. Select option 3 (Debit) → enter `200.00` 4. Select option 1 (View Balance) 5. Select option 4 (Exit) | Step 1: `1000.00` Step 2: `1500.00` Step 3: `1300.00` Step 4: `1300.00` Step 5: `Exiting the program. Goodbye!` | | | Happy path end-to-end |
| IT-002 | Credit then insufficient debit | Fresh start; balance `1000.00` | 1. Credit `500.00` 2. Debit `2000.00` 3. View Balance | Step 1: balance `1500.00` Step 2: `Insufficient funds` Step 3: balance `1500.00` | | | Balance unchanged after failed debit |
| IT-003 | Debit entire balance then attempt further debit | Fresh start; balance `1000.00` | 1. Debit `1000.00` 2. Debit `1.00` 3. View Balance | Step 1: balance `0.00` Step 2: `Insufficient funds` Step 3: balance `0.00` | | | Zero balance blocks further debits |
| IT-004 | Invalid menu choice handling | Fresh start | 1. Enter `5` 2. Enter `0` 3. Enter `9` 4. Select option 1 (View Balance) 5. Exit | Steps 1–3: `Invalid choice, please select 1-4.` Step 4: `1000.00` Step 5: normal exit | | | Invalid input does not alter state |
| IT-005 | Exit immediately | Fresh start | 1. Select option 4 (Exit) | Displays `Exiting the program. Goodbye!` and program terminates | | | Minimal interaction |
| IT-006 | Multiple credits followed by full debit | Fresh start; balance `1000.00` | 1. Credit `100.00` 2. Credit `200.00` 3. Credit `300.00` 4. Debit `1600.00` 5. View Balance | Step 1: `1100.00` Step 2: `1300.00` Step 3: `1600.00` Step 4: `0.00` Step 5: `0.00` | | | Validates cumulative credits and exact debit |
| IT-007 | Alternating credits and debits | Fresh start; balance `1000.00` | 1. Credit `500.00` 2. Debit `300.00` 3. Credit `100.00` 4. Debit `1300.00` 5. View Balance | Step 1: `1500.00` Step 2: `1200.00` Step 3: `1300.00` Step 4: `0.00` Step 5: `0.00` | | | Mixed operations in sequence |

---

## 4. Business Rules Validation

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|--------------|-----------------------|----------------|------------|-----------------|---------------|---------------------|----------|
| BR-001 | Balance never goes negative | Balance is `100.00` | 1. Debit `100.01` | Debit rejected; balance stays `100.00` | | | Core business rule |
| BR-002 | Initial balance is always 1000.00 | Fresh application start | 1. View Balance | Balance is `1000.00` | | | Default state on every new session |
| BR-003 | Balance precision to 2 decimal places | Balance is `1000.00` | 1. Credit `0.01` 2. View Balance | Balance is `1000.01` | | | Decimal precision preserved |
| BR-004 | Balance does not persist across sessions | Completed a session with modified balance | 1. Restart the application 2. View Balance | Balance is `1000.00` (reset to default) | | | In-memory storage only |
| BR-005 | Maximum balance cap | Balance is `999999.00` | 1. Credit `1.00` | Balance is `999999.99` or overflow behavior handled | | | Node.js migration should validate upper bound |

---

## Notes for Node.js Migration

- **DL-*** tests map to unit tests for a data/storage module (e.g., an in-memory store or database layer).
- **OP-*** tests map to unit tests for a service/operations module with mocked data layer.
- **IT-*** tests map to integration tests exercising the full stack (routes/CLI → service → data).
- **BR-*** tests should be enforced as invariants in the service layer and validated in both unit and integration tests.
- Consider adding input validation tests in Node.js (e.g., non-numeric input, negative amounts) that the COBOL app does not explicitly handle.
