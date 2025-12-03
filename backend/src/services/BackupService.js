const fs = require('fs');
const path = require('path');

/**
 * Service de gestion des backups automatiques pour les configurations
 */
class BackupService {
  constructor(configDir = path.join(__dirname, '../../config')) {
    this.configDir = configDir;
    this.backupDir = path.join(configDir, 'backups');
    this.ensureBackupDir();
  }

  /**
   * Créer le répertoire backups s'il n'existe pas
   */
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Créer un backup d'un fichier config
   */
  backup(filename, label = null) {
    const sourcePath = path.join(this.configDir, filename);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️ File not found for backup: ${sourcePath}`);
      return false;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const baseName = filename.replace('.json', '');
      const labelStr = label ? `_${label}` : '';
      const backupName = `${baseName}${labelStr}_${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupName);

      const data = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(backupPath, data, 'utf8');

      console.log(`💾 Backup created: ${backupName}`);
      return backupName;
    } catch (error) {
      console.error(`❌ Backup failed for ${filename}:`, error);
      return false;
    }
  }

  /**
   * Lister tous les backups disponibles
   */
  listBackups(filename) {
    const baseName = filename.replace('.json', '');
    const pattern = new RegExp(`^${baseName}.*\\.json$`);

    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => pattern.test(f))
        .sort()
        .reverse(); // Plus récents en premier

      return files.map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        timestamp: f.split('_').slice(-1)[0].replace('.json', ''),
      }));
    } catch (error) {
      console.error(`Error listing backups:`, error);
      return [];
    }
  }

  /**
   * Restaurer un backup
   */
  restore(backupName, targetFilename) {
    const backupPath = path.join(this.backupDir, backupName);
    const targetPath = path.join(this.configDir, targetFilename);

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup not found: ${backupName}`);
      return false;
    }

    try {
      // Créer un backup du fichier courant avant de restaurer
      this.backup(targetFilename, 'pre-restore');

      const data = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(targetPath, data, 'utf8');

      console.log(`✅ Restored from backup: ${backupName}`);
      return true;
    } catch (error) {
      console.error(`❌ Restore failed:`, error);
      return false;
    }
  }

  /**
   * Nettoyer les anciens backups (garder seulement les N derniers)
   */
  cleanup(filename, keepCount = 10) {
    const backups = this.listBackups(filename);

    if (backups.length <= keepCount) {
      return;
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        fs.unlinkSync(backup.path);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting backup ${backup.name}:`, error);
      }
    }

    console.log(`🗑️ Cleaned up ${deletedCount} old backups for ${filename}`);
  }
}

module.exports = BackupService;
