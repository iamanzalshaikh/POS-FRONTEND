
/**
 * Diagnostic Script: Offline Invoice Numbering Simulation
 * This script simulates the logic now present in POSInterface.tsx
 */

function simulateOfflineSales(lane: number, total: number, startFrom: number, saleCount: number) {
  console.log(`\n--- SIMULATING OFFLINE: Terminal Lane ${lane} of ${total} ---`);
  
  let currentLastSequence = startFrom;
  const results: string[] = [];

  for (let i = 1; i <= saleCount; i++) {
    let nextSeq: number;
    
    // Exact logic from POSInterface.tsx:
    if (currentLastSequence > 0) {
      nextSeq = currentLastSequence + total;
    } else {
      nextSeq = lane;
    }
    
    const invoiceNumber = String(nextSeq).padStart(6, '0');
    results.push(`Sale ${i}: ${invoiceNumber}`);
    
    // Update local state for next sale
    currentLastSequence = nextSeq;
  }
  
  console.log(results.join('\n'));
}

console.log("🚀 Testing Interleaved Offline Logic Simulation...");

// Test Case 1: 2 Terminals (Lane 1)
simulateOfflineSales(1, 2, 0, 4); // Start fresh

// Test Case 2: 2 Terminals (Lane 2)
simulateOfflineSales(2, 2, 0, 4); // Start fresh

// Test Case 3: 3 Terminals (Lane 1)
simulateOfflineSales(1, 3, 0, 4);

// Test Case 4: 3 Terminals (Lane 2)
simulateOfflineSales(2, 3, 0, 4);

// Test Case 5: 3 Terminals (Lane 3)
simulateOfflineSales(3, 3, 0, 4);

// Test Case 6: Resuming after some online sales (Lane 2 of 2)
// Suppose last online sale was 000002
simulateOfflineSales(2, 2, 2, 3); 

console.log("\n🏁 Simulation Finished.");
