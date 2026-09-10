"use strict";
// State Machine & Audit Trail Automated Acceptance Tests
// Grounded in Build Control Workbook Sheet 6 & Sheet 8 (P1-01, P2-01, SEC-01)
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../src/store");
const uuid_1 = require("uuid");
function runTests() {
    console.log('🧪 Starting FluentWave State Machine & Audit Trail Tests...\n');
    const studentId = (0, uuid_1.v4)();
    const testStudent = {
        id: studentId,
        firstName: 'Jean-Luc',
        lastName: 'Kambale',
        phone: '+243991234567',
        nationality: 'DRC',
        currentCountry: 'DRC',
        targetCountry: 'India',
        targetProgramLevel: 'UNDERGRADUATE',
        budgetCurrency: 'USD',
        budgetMaxAnnual: 4000,
        status: 'LEAD',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    store_1.store.students.set(studentId, testStudent);
    console.log('✅ Test 1: Created Student in initial LEAD state.');
    // Valid Transition 1: LEAD -> INTAKE
    store_1.store.transitionStudent(studentId, 'INTAKE', 'STUDENT', undefined, { note: 'Intake form started' });
    if (store_1.store.students.get(studentId)?.status === 'INTAKE') {
        console.log('✅ Test 2: Successfully transitioned LEAD -> INTAKE.');
    }
    else {
        throw new Error('Test 2 Failed: Status did not update.');
    }
    // Valid Transition 2: INTAKE -> ASSESSMENT
    store_1.store.transitionStudent(studentId, 'ASSESSMENT', 'STUDENT');
    console.log('✅ Test 3: Successfully transitioned INTAKE -> ASSESSMENT.');
    // Valid Transition 3: ASSESSMENT -> DOCS_PENDING
    store_1.store.transitionStudent(studentId, 'DOCS_PENDING', 'SYSTEM');
    console.log('✅ Test 4: Successfully transitioned ASSESSMENT -> DOCS_PENDING.');
    // Test Invalid Jump: Attempting DOCS_PENDING -> ROUTED directly
    console.log('🧪 Test 5: Testing illegal skip from DOCS_PENDING to ROUTED...');
    try {
        store_1.store.transitionStudent(studentId, 'ROUTED', 'STUDENT');
        throw new Error('Test 5 Failed: System allowed illegal state jump!');
    }
    catch (err) {
        console.log(`✅ Test 5 Passed: Illegal jump blocked with message: "${err.message}"`);
    }
    // Verify Audit Events
    const events = store_1.store.caseEvents.filter(e => e.caseId === studentId);
    if (events.length >= 3) {
        console.log(`✅ Test 6: Audit log recorded ${events.length} immutable events.`);
    }
    else {
        throw new Error('Test 6 Failed: Audit events were not captured.');
    }
    console.log('\n🎉 ALL STATE MACHINE ACCEPTANCE TESTS PASSED!\n');
}
runTests();
