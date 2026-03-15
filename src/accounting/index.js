const readline = require("readline");

// =============================================================================
// Data Layer (equivalent to data.cob — DataProgram)
// =============================================================================

let storageBalance = 1000.0;
const MAX_BALANCE = 999999.99;

function dataProgram(operation, balance) {
  if (operation === "READ") {
    return storageBalance;
  } else if (operation === "WRITE") {
    storageBalance = balance;
  }
}

// =============================================================================
// Operations Layer (equivalent to operations.cob — Operations)
// =============================================================================

function viewBalance() {
  const balance = dataProgram("READ");
  console.log(`Current balance: ${formatBalance(balance)}`);
}

function creditAccount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    console.log("Invalid amount. Please enter a non-negative, finite number.");
    return;
  }
  let balance = dataProgram("READ");
  const newBalance = +(balance + amount).toFixed(2);
  if (newBalance > MAX_BALANCE) {
    console.log(
      `Operation rejected. Resulting balance would exceed maximum allowed balance of ${formatBalance(MAX_BALANCE)}.`
    );
    return;
  }
  balance = newBalance;
  dataProgram("WRITE", balance);
  console.log(`Amount credited. New balance: ${formatBalance(balance)}`);
}

function debitAccount(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    console.log("Invalid amount. Please enter a non-negative, finite number.");
    return;
  }
  let balance = dataProgram("READ");
  if (balance >= amount) {
    balance = +(balance - amount).toFixed(2);
    dataProgram("WRITE", balance);
    console.log(`Amount debited. New balance: ${formatBalance(balance)}`);
  } else {
    console.log("Insufficient funds for this debit.");
  }
}

// =============================================================================
// Helpers
// =============================================================================

function formatBalance(value) {
  return value.toFixed(2).padStart(9, "0");
}

// =============================================================================
// Input handling — works with both interactive TTY and piped input
// =============================================================================

function createInputReader() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const lineQueue = [];
  const waitingResolvers = [];
  let closed = false;

  rl.on("line", (line) => {
    if (waitingResolvers.length > 0) {
      waitingResolvers.shift()(line);
    } else {
      lineQueue.push(line);
    }
  });

  rl.on("close", () => {
    closed = true;
    // Resolve any remaining waiters with null to signal end of input
    while (waitingResolvers.length > 0) {
      waitingResolvers.shift()(null);
    }
  });

  function ask(message) {
    process.stdout.write(message);
    if (lineQueue.length > 0) {
      return Promise.resolve(lineQueue.shift());
    }
    if (closed) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      waitingResolvers.push(resolve);
    });
  }

  function close() {
    rl.close();
  }

  return { ask, close };
}

// =============================================================================
// Main Program (equivalent to main.cob — MainProgram)
// =============================================================================

async function main() {
  const input = createInputReader();
  let running = true;

  while (running) {
    console.log("--------------------------------");
    console.log("Account Management System");
    console.log("1. View Balance");
    console.log("2. Credit Account");
    console.log("3. Debit Account");
    console.log("4. Exit");
    console.log("--------------------------------");

    const choice = await input.ask("Enter your choice (1-4): ");
    if (choice === null) break;

    switch (choice.trim()) {
      case "1":
        viewBalance();
        break;
      case "2": {
        const creditInput = await input.ask("Enter credit amount: ");
        if (creditInput === null) { running = false; break; }
        const creditAmount = parseFloat(creditInput);
        if (isNaN(creditAmount) || creditAmount < 0) {
          console.log("Invalid amount.");
        } else {
          creditAccount(creditAmount);
        }
        break;
      }
      case "3": {
        const debitInput = await input.ask("Enter debit amount: ");
        if (debitInput === null) { running = false; break; }
        const debitAmount = parseFloat(debitInput);
        if (isNaN(debitAmount) || debitAmount < 0) {
          console.log("Invalid amount.");
        } else {
          debitAccount(debitAmount);
        }
        break;
      }
      case "4":
        running = false;
        break;
      default:
        console.log("Invalid choice, please select 1-4.");
        break;
    }
  }

  console.log("Exiting the program. Goodbye!");
  input.close();
}

// Export for testing; run main only when executed directly
module.exports = {
  dataProgram,
  viewBalance,
  creditAccount,
  debitAccount,
  formatBalance,
  resetBalance: () => { storageBalance = 1000.0; },
};

if (require.main === module) {
  main();
}
