/**
 * PM2 프로세스 관리 설정 파일
 * 프로덕션 환경에서 백엔드 서버를 관리하기 위한 설정
 */

module.exports = {
  apps: [
    {
      // 메인 백엔드 API 서버
      name: 'wallix-backend',
      script: './packages/backend/dist/index.js',
      cwd: './',
      instances: 'max', // CPU 코어 수만큼 인스턴스 생성
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // 로그 설정
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 재시작 설정
      watch: false, // 프로덕션에서는 watch 비활성화
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s',
      
      // 메모리 관리
      max_memory_restart: '1G',
      
      // 기타 설정
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    
    // 관리자 서버 (선택사항)
    {
      name: 'wallix-admin',
      script: './packages/backend/admin-server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 3002
      },
      env_development: {
        NODE_ENV: 'development',
        ADMIN_PORT: 3002
      },
      // 로그 설정
      log_file: './logs/admin-combined.log',
      out_file: './logs/admin-out.log',
      error_file: './logs/admin-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 재시작 설정
      watch: false,
      max_restarts: 5,
      min_uptime: '10s',
      
      // 메모리 관리
      max_memory_restart: '500M'
    }
  ]
}