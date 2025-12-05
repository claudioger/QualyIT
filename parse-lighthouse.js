const r = require('./lighthouse-report.json');

console.log('=== LIGHTHOUSE AUDIT RESULTS ===\n');

console.log('SCORES:');
console.log('- Performance:', Math.round(r.categories.performance.score * 100));
console.log('- Accessibility:', Math.round(r.categories.accessibility.score * 100));
console.log('- Best Practices:', Math.round(r.categories['best-practices'].score * 100));
console.log('- SEO:', Math.round(r.categories.seo.score * 100));

console.log('\nFAILED AUDITS (score < 1):');
const fails = Object.values(r.audits).filter(a => a.score !== null && a.score < 1);
fails.slice(0, 20).forEach(a => {
  console.log(`- ${a.id}: ${a.title} (score: ${a.score})`);
});

console.log('\nACCESSIBILITY ISSUES:');
const a11y = Object.values(r.audits).filter(a =>
  a.score !== null &&
  a.score < 1 &&
  r.categories.accessibility.auditRefs.some(ref => ref.id === a.id)
);
a11y.forEach(a => {
  console.log(`\n[${a.id}] ${a.title}`);
  if (a.details && a.details.items) {
    a.details.items.slice(0, 3).forEach(item => {
      console.log('  -', item.node?.snippet || item.selector || 'N/A');
    });
  }
});
