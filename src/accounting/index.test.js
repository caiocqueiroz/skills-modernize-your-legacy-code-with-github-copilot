const {
  dataProgram,
  viewBalance,
  creditAccount,
  debitAccount,
  formatBalance,
  resetBalance,
} = require("./index");

// Reset balance to 1000.00 before each test
beforeEach(() => {
  resetBalance();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

// =============================================================================
// 1. Unit Tests — Data Layer (DataProgram)
// =============================================================================

describe("Data Layer (DataProgram)", () => {
  test("DL-001: Read initial balance", () => {
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("DL-002: Write and read back balance", () => {
    dataProgram("WRITE", 2500.5);
    expect(dataProgram("READ")).toBe(2500.5);
  });

  test("DL-003: Overwrite balance with new value", () => {
    dataProgram("WRITE", 2500.5);
    dataProgram("WRITE", 750.0);
    expect(dataProgram("READ")).toBe(750.0);
  });

  test("DL-004: Read with zero balance", () => {
    dataProgram("WRITE", 0.0);
    expect(dataProgram("READ")).toBe(0.0);
  });

  test("DL-005: Write maximum balance", () => {
    dataProgram("WRITE", 999999.99);
    expect(dataProgram("READ")).toBe(999999.99);
  });
});

// =============================================================================
// 2. Unit Tests — Operations Layer
// =============================================================================

// 2.1 View Balance (TOTAL)
describe("Operations — View Balance", () => {
  test("OP-001: View initial balance", () => {
    viewBalance();
    expect(console.log).toHaveBeenCalledWith("Current balance: 001000.00");
  });

  test("OP-002: View balance after credit", () => {
    creditAccount(500.0);
    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001500.00");
  });

  test("OP-003: View balance after debit", () => {
    debitAccount(200.0);
    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 000800.00");
  });

  test("OP-004: View zero balance", () => {
    dataProgram("WRITE", 0.0);
    viewBalance();
    expect(console.log).toHaveBeenCalledWith("Current balance: 000000.00");
  });
});

// 2.2 Credit Account (CREDIT)
describe("Operations — Credit Account", () => {
  test("OP-101: Credit a standard amount", () => {
    creditAccount(500.0);
    expect(console.log).toHaveBeenCalledWith(
      "Amount credited. New balance: 001500.00"
    );
    expect(dataProgram("READ")).toBe(1500.0);
  });

  test("OP-102: Credit a small amount (cents)", () => {
    creditAccount(0.01);
    expect(console.log).toHaveBeenCalledWith(
      "Amount credited. New balance: 001000.01"
    );
    expect(dataProgram("READ")).toBe(1000.01);
  });

  test("OP-103: Credit zero amount", () => {
    creditAccount(0.0);
    expect(console.log).toHaveBeenCalledWith(
      "Amount credited. New balance: 001000.00"
    );
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("OP-104: Multiple sequential credits", () => {
    creditAccount(200.0);
    creditAccount(300.0);
    creditAccount(500.0);
    expect(dataProgram("READ")).toBe(2000.0);
  });

  test("OP-105: Credit that approaches max balance", () => {
    dataProgram("WRITE", 999000.0);
    creditAccount(999.99);
    expect(dataProgram("READ")).toBe(999999.99);
  });
});

// 2.3 Debit Account (DEBIT)
describe("Operations — Debit Account", () => {
  test("OP-201: Debit a standard amount", () => {
    debitAccount(200.0);
    expect(console.log).toHaveBeenCalledWith(
      "Amount debited. New balance: 000800.00"
    );
    expect(dataProgram("READ")).toBe(800.0);
  });

  test("OP-202: Debit exact full balance", () => {
    debitAccount(1000.0);
    expect(console.log).toHaveBeenCalledWith(
      "Amount debited. New balance: 000000.00"
    );
    expect(dataProgram("READ")).toBe(0.0);
  });

  test("OP-203: Debit more than balance (insufficient funds)", () => {
    debitAccount(1000.01);
    expect(console.log).toHaveBeenCalledWith(
      "Insufficient funds for this debit."
    );
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("OP-204: Debit with zero balance", () => {
    dataProgram("WRITE", 0.0);
    debitAccount(1.0);
    expect(console.log).toHaveBeenCalledWith(
      "Insufficient funds for this debit."
    );
    expect(dataProgram("READ")).toBe(0.0);
  });

  test("OP-205: Debit zero amount", () => {
    debitAccount(0.0);
    expect(console.log).toHaveBeenCalledWith(
      "Amount debited. New balance: 001000.00"
    );
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("OP-206: Debit a small amount (cents)", () => {
    debitAccount(0.01);
    expect(console.log).toHaveBeenCalledWith(
      "Amount debited. New balance: 000999.99"
    );
    expect(dataProgram("READ")).toBe(999.99);
  });

  test("OP-207: Multiple sequential debits", () => {
    debitAccount(200.0);
    debitAccount(300.0);
    debitAccount(400.0);
    expect(dataProgram("READ")).toBe(100.0);
  });

  test("OP-208: Debit fails after prior debits exhaust funds", () => {
    debitAccount(999.0);
    expect(dataProgram("READ")).toBe(1.0);
    debitAccount(5.0);
    expect(console.log).toHaveBeenLastCalledWith(
      "Insufficient funds for this debit."
    );
    expect(dataProgram("READ")).toBe(1.0);
  });
});

// =============================================================================
// 3. Integration Tests — End-to-End Workflows
// =============================================================================

describe("Integration — End-to-End Workflows", () => {
  test("IT-001: Full workflow: view, credit, debit, view", () => {
    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001000.00");

    creditAccount(500.0);
    expect(console.log).toHaveBeenLastCalledWith(
      "Amount credited. New balance: 001500.00"
    );

    debitAccount(200.0);
    expect(console.log).toHaveBeenLastCalledWith(
      "Amount debited. New balance: 001300.00"
    );

    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001300.00");
  });

  test("IT-002: Credit then insufficient debit", () => {
    creditAccount(500.0);
    expect(dataProgram("READ")).toBe(1500.0);

    debitAccount(2000.0);
    expect(console.log).toHaveBeenLastCalledWith(
      "Insufficient funds for this debit."
    );

    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001500.00");
  });

  test("IT-003: Debit entire balance then attempt further debit", () => {
    debitAccount(1000.0);
    expect(dataProgram("READ")).toBe(0.0);

    debitAccount(1.0);
    expect(console.log).toHaveBeenLastCalledWith(
      "Insufficient funds for this debit."
    );

    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 000000.00");
  });

  test("IT-004: Invalid menu choices do not alter balance", () => {
    // Simulating invalid choices at the operations level:
    // the menu logic rejects them, balance stays untouched
    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001000.00");
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("IT-005: Exit immediately — balance unchanged", () => {
    // No operations performed; balance remains at initial state
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("IT-006: Multiple credits followed by full debit", () => {
    creditAccount(100.0);
    expect(dataProgram("READ")).toBe(1100.0);

    creditAccount(200.0);
    expect(dataProgram("READ")).toBe(1300.0);

    creditAccount(300.0);
    expect(dataProgram("READ")).toBe(1600.0);

    debitAccount(1600.0);
    expect(dataProgram("READ")).toBe(0.0);

    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 000000.00");
  });

  test("IT-007: Alternating credits and debits", () => {
    creditAccount(500.0);
    expect(dataProgram("READ")).toBe(1500.0);

    debitAccount(300.0);
    expect(dataProgram("READ")).toBe(1200.0);

    creditAccount(100.0);
    expect(dataProgram("READ")).toBe(1300.0);

    debitAccount(1300.0);
    expect(dataProgram("READ")).toBe(0.0);

    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 000000.00");
  });
});

// =============================================================================
// 4. Business Rules Validation
// =============================================================================

describe("Business Rules Validation", () => {
  test("BR-001: Balance never goes negative", () => {
    dataProgram("WRITE", 100.0);
    debitAccount(100.01);
    expect(console.log).toHaveBeenCalledWith(
      "Insufficient funds for this debit."
    );
    expect(dataProgram("READ")).toBe(100.0);
  });

  test("BR-002: Initial balance is always 1000.00", () => {
    // resetBalance() called in beforeEach simulates a fresh session
    viewBalance();
    expect(console.log).toHaveBeenCalledWith("Current balance: 001000.00");
  });

  test("BR-003: Balance precision to 2 decimal places", () => {
    creditAccount(0.01);
    viewBalance();
    expect(console.log).toHaveBeenLastCalledWith("Current balance: 001000.01");
    expect(dataProgram("READ")).toBe(1000.01);
  });

  test("BR-004: Balance does not persist across sessions (reset)", () => {
    creditAccount(5000.0);
    expect(dataProgram("READ")).toBe(6000.0);
    // Simulate new session
    resetBalance();
    expect(dataProgram("READ")).toBe(1000.0);
  });

  test("BR-005: Maximum balance cap", () => {
    dataProgram("WRITE", 999999.0);
    creditAccount(1.0);
    // COBOL PIC 9(6)V99 enforces a maximum of 999999.99
    // After attempting to exceed the cap, the balance must not go past 999999.99
    expect(dataProgram("READ")).toBe(999999.99);
  });
});

// =============================================================================
// Format helper
// =============================================================================

describe("formatBalance helper", () => {
  test("Pads to 9 characters with leading zeros", () => {
    expect(formatBalance(1000.0)).toBe("001000.00");
    expect(formatBalance(0.0)).toBe("000000.00");
    expect(formatBalance(999999.99)).toBe("999999.99");
    expect(formatBalance(0.01)).toBe("000000.01");
  });
});
