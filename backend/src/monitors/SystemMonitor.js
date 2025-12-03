const os = require('os');
const si = require('systeminformation');
const GpuMonitor = require('./GpuMonitor');

class SystemMonitor {
  constructor() {
    this.metrics = {};
    this.startTime = Date.now();
    this.gpuMonitor = new GpuMonitor();
  }

  async collectMetrics() {
    try {
      const [cpu, memory, disk, networkStats, gpu] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        this.gpuMonitor.collectGpuMetrics(),
      ]);

      this.metrics = {
        timestamp: Date.now(),
        gpu: gpu ? this.gpuMonitor.getAggregatedMetrics() : { total_utilization: 0, total_memory_used: 0, total_memory: 0, average_temperature: 0, device_count: 0, devices: [] },
        cpu: {
          percent: Math.round(cpu.currentLoad * 10) / 10,
          cores: cpu.cpus.map((c) => Math.round(c.load * 10) / 10),
          count: os.cpus().length,
          model: os.cpus()[0]?.model || 'Unknown',
        },
        memory: {
          used: Math.round((memory.used / 1024 / 1024 / 1024) * 100) / 100,
          total: Math.round((memory.total / 1024 / 1024 / 1024) * 100) / 100,
          percent: Math.round((memory.used / memory.total) * 100),
          free: Math.round((memory.available / 1024 / 1024 / 1024) * 100) / 100,
        },
        disk: this._processDiskMetrics(disk),
        network: this._processNetworkMetrics(networkStats),
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        loadAverage: os.loadavg(),
      };

      return this.metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      return this.metrics;
    }
  }

  _processDiskMetrics(diskData) {
    if (!diskData || diskData.length === 0) {
      return { used: 0, total: 0, percent: 0, volumes: [] };
    }

    const totalDisk = diskData.reduce(
      (acc, disk) => ({
        used: acc.used + disk.used,
        total: acc.total + disk.size,
      }),
      { used: 0, total: 0 }
    );

    return {
      used: Math.round((totalDisk.used / 1024 / 1024 / 1024) * 100) / 100,
      total: Math.round((totalDisk.total / 1024 / 1024 / 1024) * 100) / 100,
      percent: Math.round((totalDisk.used / totalDisk.total) * 100),
      volumes: diskData.map((disk) => ({
        filesystem: disk.fs,
        mount: disk.mount,
        used: Math.round((disk.used / 1024 / 1024 / 1024) * 100) / 100,
        total: Math.round((disk.size / 1024 / 1024 / 1024) * 100) / 100,
        percent: disk.use,
      })),
    };
  }

  _processNetworkMetrics(networkStats) {
    if (!networkStats || networkStats.length === 0) {
      return { in: 0, out: 0 };
    }

    const totals = networkStats.reduce(
      (acc, iface) => ({
        in: acc.in + (iface.rx_bytes || 0),
        out: acc.out + (iface.tx_bytes || 0),
      }),
      { in: 0, out: 0 }
    );

    return {
      in: Math.round((totals.in / 1024 / 1024) * 100) / 100, // MB
      out: Math.round((totals.out / 1024 / 1024) * 100) / 100, // MB
    };
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = SystemMonitor;
