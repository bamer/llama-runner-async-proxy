const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class GpuMonitor {
  constructor() {
    this.gpuData = {
      available: false,
      type: null, // 'nvidia', 'amd', 'intel', 'none'
      devices: [],
    };
    this.lastUpdate = 0;
    this.updateInterval = 1000; // Minimum 1 second between updates to avoid spam
    this.initializeGpuDetection();
  }

  async initializeGpuDetection() {
    try {
      // Vérifier NVIDIA
      const { stdout: nvidiaOut } = await execAsync('which nvidia-smi 2>/dev/null', { timeout: 2000 }).catch(() => ({ stdout: '' }));
      if (nvidiaOut) {
        this.gpuData.type = 'nvidia';
        this.gpuData.available = true;
        console.log('✅ NVIDIA GPU detected');
        return;
      }

      // Vérifier AMD
      const { stdout: amdOut } = await execAsync('which rocm-smi 2>/dev/null', { timeout: 2000 }).catch(() => ({ stdout: '' }));
      if (amdOut) {
        this.gpuData.type = 'amd';
        this.gpuData.available = true;
        console.log('✅ AMD GPU detected');
        return;
      }

      // Vérifier Intel
      const { stdout: intelOut } = await execAsync('which intel-gpu-top 2>/dev/null', { timeout: 2000 }).catch(() => ({ stdout: '' }));
      if (intelOut) {
        this.gpuData.type = 'intel';
        this.gpuData.available = true;
        console.log('✅ Intel GPU detected');
        return;
      }

      console.log('⚠️  No GPU detected (nvidia-smi, rocm-smi, or intel-gpu-top not found)');
      this.gpuData.available = false;
      this.gpuData.type = 'none';
    } catch (error) {
      console.warn('Error detecting GPU:', error.message);
      this.gpuData.available = false;
    }
  }

  async collectGpuMetrics() {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return this.gpuData;
    }

    if (!this.gpuData.available || this.gpuData.type === 'none') {
      return {
        available: false,
        devices: [],
        message: 'No GPU detected',
      };
    }

    try {
      if (this.gpuData.type === 'nvidia') {
        await this._collectNvidiaMetrics();
      } else if (this.gpuData.type === 'amd') {
        await this._collectAmdMetrics();
      } else if (this.gpuData.type === 'intel') {
        await this._collectIntelMetrics();
      }

      this.lastUpdate = now;
    } catch (error) {
      console.error('Error collecting GPU metrics:', error.message);
      // Retourner le dernier état connu au lieu de crasher
      return this.gpuData;
    }

    return this.gpuData;
  }

  async _collectNvidiaMetrics() {
    try {
      // Format: index, name, driver_version, vbios_version, pci.bus_id, 
      // pci.domain, pci.device, pci.sub_device, gpu_uuid, vram.total, 
      // vram.free, vram.used, utilization.gpu, utilization.memory, 
      // power.draw, power.limit, clocks.current.graphics, clocks.max.graphics,
      // clocks.current.memory, clocks.max.memory, temperature.gpu, 
      // temperature.memory, compute_cap

      const query = [
        'index',
        'name',
        'driver_version',
        'memory.total',
        'memory.used',
        'memory.free',
        'utilization.gpu',
        'utilization.memory',
        'power.draw',
        'power.limit',
        'temperature.gpu',
        'clocks.current.graphics',
        'clocks.max.graphics',
        'clocks.current.memory',
        'clocks.max.memory',
        'compute_cap',
      ].join(',');

      const { stdout } = await execAsync(
        `nvidia-smi --query-gpu=${query} --format=csv,noheader,nounits`,
        { timeout: 5000 }
      );

      const lines = stdout.trim().split('\n');
      this.gpuData.devices = lines.map((line, idx) => {
        const values = line.split(',').map(v => v.trim());
        const device = {
          id: idx,
          name: values[1] || `GPU ${idx}`,
          memory_total: parseInt(values[3]) || 0,
          memory_used: parseInt(values[4]) || 0,
          memory_free: parseInt(values[5]) || 0,
          utilization_gpu: parseInt(values[6]) || 0,
          utilization_memory: parseInt(values[7]) || 0,
          power_draw: parseFloat(values[8]) || 0,
          power_limit: parseFloat(values[9]) || 0,
          temperature: parseInt(values[10]) || 0,
          clock_gpu: parseInt(values[11]) || 0,
          clock_gpu_max: parseInt(values[12]) || 0,
          clock_memory: parseInt(values[13]) || 0,
          clock_memory_max: parseInt(values[14]) || 0,
          compute_cap: values[15] || 'N/A',
        };
        return device;
      });

      this.gpuData.available = this.gpuData.devices.length > 0;
      if (this.gpuData.devices.length > 0) {
       // console.log('✅ NVIDIA metrics collected:', JSON.stringify(this.gpuData.devices[0], null, 2));
      }
    } catch (error) {
      console.error('Error collecting NVIDIA metrics:', error.message);
      this.gpuData.available = false;
    }
  }

  async _collectAmdMetrics() {
    try {
      // rocm-smi output format varies, basic parsing
      const { stdout } = await execAsync('rocm-smi --json', { timeout: 5000 }).catch(() => 
        execAsync('rocm-smi', { timeout: 5000 })
      );

      // Try JSON format first
      try {
        const data = JSON.parse(stdout);
        this.gpuData.devices = data.map((gpu, idx) => ({
          id: idx,
          name: gpu.cardModel || gpu.Card || `GPU ${idx}`,
          utilization_gpu: parseInt(gpu.gpu_use || 0),
          temperature: parseInt(gpu.Temperature || gpu.EdgeTemperature || 0),
          memory_total: parseInt(gpu.gpu_mem || 0) * 1024, // GB to MB
          power_draw: parseFloat(gpu.power || 0),
        }));
      } catch {
        // Fallback to text parsing
        const lines = stdout.split('\n');
        this.gpuData.devices = [];
      }

      this.gpuData.available = this.gpuData.devices.length > 0;
    } catch (error) {
      console.error('Error collecting AMD metrics:', error.message);
      this.gpuData.available = false;
    }
  }

  async _collectIntelMetrics() {
    try {
      // intel-gpu-top format
      const { stdout } = await execAsync(
        'intel-gpu-top -s 100 -o - | head -50',
        { timeout: 5000 }
      );

      // Parse intel-gpu-top output
      // Basic parsing - intel-gpu-top output varies by version
      this.gpuData.devices = [
        {
          id: 0,
          name: 'Intel Arc GPU',
          utilization_gpu: 0,
          temperature: 0,
        },
      ];

      this.gpuData.available = true;
    } catch (error) {
      console.error('Error collecting Intel metrics:', error.message);
      this.gpuData.available = false;
    }
  }

  getMetrics() {
    return this.gpuData;
  }

  getAggregatedMetrics() {
    if (!this.gpuData.available || this.gpuData.devices.length === 0) {
      return {
        total_utilization: 0,
        total_memory_used: 0,
        total_memory: 0,
        average_temperature: 0,
        device_count: 0,
      };
    }

    const devices = this.gpuData.devices;
    const totalUtilization = devices.reduce((sum, d) => sum + (d.utilization_gpu || 0), 0) / devices.length;
    const totalMemoryUsed = devices.reduce((sum, d) => sum + (d.memory_used || 0), 0);
    const totalMemory = devices.reduce((sum, d) => sum + (d.memory_total || 0), 0);
    const avgTemp = devices.reduce((sum, d) => sum + (d.temperature || 0), 0) / devices.length;

    return {
      total_utilization: Math.round(totalUtilization),
      total_memory_used: Math.round(totalMemoryUsed),
      total_memory: Math.round(totalMemory),
      average_temperature: Math.round(avgTemp),
      device_count: devices.length,
      devices,
    };
  }
}

module.exports = GpuMonitor;
