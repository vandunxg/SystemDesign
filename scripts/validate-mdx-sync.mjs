import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

const maps = read('content/docs/volume-2/chapter-03-google-maps.mdx');
const queue = read('content/docs/volume-2/chapter-04-distributed-message-queue.mdx');
const metrics = read('content/docs/volume-2/chapter-05-metrics-monitoring-and-alerting-system.mdx');
const leaderboard = read('content/docs/volume-2/chapter-10-real-time-gaming-leaderboard.mdx');
const payments = read('content/docs/volume-2/chapter-11-payment-system.mdx');
const exchange = read('content/docs/volume-2/chapter-13-stock-exchange.mdx');
const hotel = read('content/docs/volume-2/chapter-07-hotel-reservation-system.mdx');
const wallet = read('content/docs/volume-2/chapter-12-digital-wallet.mdx');
const sourceConfig = read('source.config.ts');
const mdxComponents = read('components/mdx.tsx');
const globalStyles = read('app/global.css');

assert.match(maps, /server &lt;-- 300 ms -->/);
assert.match(queue, /Partition-`\{:partition_id\}`/);
assert.match(metrics, /`<key:value>`/);
assert.doesNotMatch(metrics, /^```flux$/m);
assert.doesNotMatch(payments, /^```math$/m);
assert.match(sourceConfig, /math:\s*['"]text['"]/);
assert.match(mdxComponents, /sd-table-wrap/);
assert.match(mdxComponents, /sd-callout/);
assert.match(globalStyles, /\.sd-doc-content/);
assert.match(globalStyles, /\.sd-table-wrap/);
assert.match(globalStyles, /@media \(max-width: 768px\)/);
assert.match(globalStyles, /\.sd-callout::before/);
assert.match(globalStyles, /\.dark \.sd-doc-content :where\(:not\(pre\) > code\)/);
assert.match(globalStyles, /figure:has\(> pre\)/);
assert.match(leaderboard, /GET \/v1\/scores\/`\{\:user_id\}`/);
assert.match(payments, /`<idempotency-key: key_value>`/);
assert.match(payments, /GET \/v1\/payments\/`\{id\}`/);
assert.match(exchange, /<img [^>]+ \/>/);
assert.doesNotMatch(hotel, /%2Fimages%2F/);
assert.match(wallet, /Figure_12\.5\.png\)/);
assert.doesNotMatch(wallet, /\]\(\.\.\/images\//);
assert.doesNotMatch(maps, /!\[[^\]]*Figure3\.17[^\]]*\]\([^)]*Figure3\.17\.png\)/);
assert.match(maps, /\*\*Hình 3\.17: Dịch vụ điều hướng\*\*/);

console.log('MDX sync regression checks passed.');
