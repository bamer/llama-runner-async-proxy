const express = require('express');
const router = express.Router();

// Mock metrics collector - in real implementation this would be a proper metrics system
let metricsCollector = {
    get_summary: () => ({
        uptime: 120,
        total_models: 5,
        active_runners: 3,
        total_starts: 10,
        total_stops: 2,
        total_errors: 0,
        memory_usage: { current: "1.2GB", peak: "2.4GB" },
        load_average: "0.75"
    })
};

// GET /api/v1/monitoring/summary
router.get('/monitoring/summary', (req, res) => {
    const summary = metricsCollector.get_summary();
    res.json(summary);
});

module.exports = router;