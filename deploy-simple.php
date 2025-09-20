<?php
namespace Deployer;

require 'recipe/common.php';

// Configuration
set('repository', 'https://github.com/Prospection-Immo/estimateurimmobiliergironde.git');
set('deploy_path', '/var/www/estimation/33-gironde');
set('keep_releases', 1); // Ne garder qu'une seule release

// Host
host('91.98.129.201')
    ->set('remote_user', 'root');

// Tasks personnalisées pour déploiement direct
task('deploy:direct', function () {
    // Arrêter PM2 d'abord
    run('pm2 stop all || true');
    
    // Supprimer l'ancien code (sauf .env et node_modules)
    run('cd {{deploy_path}} && find . -maxdepth 1 -name ".*" -prune -o -name "node_modules" -prune -o -name ".env" -prune -o -type f -exec rm -f {} + -o -type d -exec rm -rf {} +');
    
    // Cloner le nouveau code
    run('cd {{deploy_path}} && git clone {{repository}} temp && mv temp/* . && mv temp/.* . 2>/dev/null || true && rm -rf temp');
    
    // Installer et compiler
    run('cd {{deploy_path}} && npm ci');
    run('cd {{deploy_path}} && npm run build');
    
    // Créer ecosystem.config.mjs si inexistant
    run('cd {{deploy_path}} && [ ! -f ecosystem.config.mjs ] && cat > ecosystem.config.mjs << EOF
export default {
  apps: [{
    name: "estimation-immobilier-gironde",
    script: "dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G"
  }]
};
EOF || true');
    
    // Relancer PM2
    run('cd {{deploy_path}} && pm2 start ecosystem.config.mjs || pm2 restart all');
});

// Tâche principale
task('deploy', [
    'deploy:direct'
]);

// En cas d'échec
after('deploy:failed', function() {
    run('cd {{deploy_path}} && pm2 restart all || true');
});