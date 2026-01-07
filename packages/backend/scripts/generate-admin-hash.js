/**
 * 관리자 비밀번호 해시 생성 스크립트
 * 사용법: node scripts/generate-admin-hash.js [비밀번호]
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2];
  
  if (!password) {
    console.error('❌ 사용법: node scripts/generate-admin-hash.js [비밀번호]');
    console.error('예시: node scripts/generate-admin-hash.js mySecurePassword123');
    process.exit(1);
  }
  
  if (password.length < 8) {
    console.error('❌ 비밀번호는 최소 8자 이상이어야 합니다');
    process.exit(1);
  }
  
  try {
    console.log('🔐 비밀번호 해시를 생성하는 중...');
    
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n✅ 해시 생성 완료!');
    console.log('📋 아래 해시를 .env 파일의 ADMIN_PASSWORD_HASH에 설정하세요:\n');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('\n⚠️  보안을 위해 이 터미널 내용을 지우고, 원본 비밀번호는 안전하게 보관하세요.');
    
  } catch (error) {
    console.error('❌ 해시 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

generateHash();