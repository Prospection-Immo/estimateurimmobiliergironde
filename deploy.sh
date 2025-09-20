#!/bin/bash

# Configuration
SERVER="root@91.98.129.201"
DEPLOY_PATH="/var/www/estimation/33-gironde"
REPO="https://github.com/Prospection-Immo/estimateurimmobiliergironde.git"

echo "🚀 Déploiement vers $SERVER..."

# Connexion SSH et déploiement
ssh $SERVER << EOF
    set -e
    
    echo "📥 Arrêt de PM2..."
    pm2 stop all || true
    
    echo "🧹 Nettoyage des anciens fichiers..."
    cd $DEPLOY_PATH
    find . -maxdepth 1 -name ".*" -prune -o -name "node_modules" -prune -o -name ".env" -prune -o -type f -exec rm -f {} + -o -type d -exec rm -rf {} +
    
    echo "📦 Téléchargement du nouveau code..."
    git clone $REPO temp
    mv temp/* . 2>/dev/null || true
    mv temp/.* . 2>/dev/null || true
    rm -rf temp
    
    echo "📚 Installation des dépendances..."
    npm ci
    
    echo "🔨 Compilation..."
    npm run build
    
    echo "⚙️ Configuration PM2..."
    if [ ! -f ecosystem.config.mjs ]; then
        cat > ecosystem.config.mjs << 'EOL'
export default {
  apps: [{
    name: 'estimation-immobilier-gironde',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOL
    fi
    
    echo "🚀 Redémarrage de l'application..."
    pm2 start ecosystem.config.mjs || pm2 restart all
    
    echo "✅ Déploiement terminé !"
    pm2 status
EOF

echo "🎉 Déploiement réussi ! Votre site est en ligne !"