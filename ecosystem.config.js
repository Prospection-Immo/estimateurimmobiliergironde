module.exports = {
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
    max_memory_restart: '1G',
    log_file: './logs/app.log',
    out_file: './logs/app-out.log',
    error_file: './logs/app-error.log',
    time: true
  }]
};