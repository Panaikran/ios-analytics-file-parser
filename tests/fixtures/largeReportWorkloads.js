const CORE_EVENT_COUNT = 5000;
const CORE_GROUP_COUNT = 250;
const STACKSHOT_PROCESS_COUNT = 5000;
const PADDING = 'SYNTHETIC-FILL-'.repeat(12);

export const LARGE_CORE_ANALYTICS_EVENT_COUNT = CORE_EVENT_COUNT;
export const LARGE_CORE_ANALYTICS_GROUP_COUNT = CORE_GROUP_COUNT;
export const LARGE_STACKSHOT_PROCESS_COUNT = STACKSHOT_PROCESS_COUNT;

export function createLargeCoreAnalyticsFixture() {
  const records = [
    {
      bug_type: '211',
      timestamp: '2026-01-01 00:00:00 +0000',
      os_version: 'Synthetic OS 1.0',
      roots_installed: false,
    },
    {
      configDbVersion: 'synthetic-config-1',
      configUuid: 'SYNTHETIC-CONFIG-0001',
      sessionId: 'SYNTHETIC-SESSION-0001',
      rolloverReason: 'synthetic rollover',
    },
  ];

  for (let index = 0; index < CORE_EVENT_COUNT; index += 1) {
    const group = index % CORE_GROUP_COUNT;
    records.push({
      message: `SyntheticMetricGroup-${pad(group, 3)}`,
      name: `SyntheticMetricEvent-${pad(index % 25, 2)}`,
      aggregationPeriod: '1h',
      numDaysAggregated: 1,
      sampling: '1',
      syntheticPayload: `${PADDING}${pad(index, 5)}`,
    });
  }

  return records.map((record) => JSON.stringify(record)).join('\n');
}

export function createLargeStackshotFixture() {
  const processByPid = {};

  for (let index = 0; index < STACKSHOT_PROCESS_COUNT; index += 1) {
    const paddedIndex = pad(index, 5);
    processByPid[String(10_000 + index)] = {
      procname: `SyntheticStackProcess-${paddedIndex}`,
      pid: 10_000 + index,
      bundleID: `com.example.synthetic.stack.${paddedIndex}`,
      cpuPercent: `${(index % 100) + 1}%`,
      physicalPages: 200_000 - index,
      role: index % 2 === 0 ? 'foreground' : 'background',
      state: index % 3 === 0 ? 'running' : 'idle',
      reason: 'synthetic workload entry',
      threadCount: index % 8,
      frameCount: index % 16,
      syntheticPayload: `${PADDING}${paddedIndex}`,
    };
  }

  return [
    JSON.stringify({
      bug_type: '288',
      incident_id: 'SYNTHETIC-STACKSHOT-INCIDENT-0001',
      timestamp: '2026-01-01 00:00:00 +0000',
    }),
    JSON.stringify({
      bug_type: '288',
      reason: 'synthetic large stackshot workload',
      memoryStatus: { pageSize: 16_384 },
      processByPid,
    }),
  ].join('\n');
}

function pad(value, width) {
  return String(value).padStart(width, '0');
}
