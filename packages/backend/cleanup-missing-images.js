/**
 * 이미지 파일이 없는 배경화면 데이터를 정리하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const WALLPAPERS_JSON_PATH = path.join(__dirname, 'src/data/wallpapers.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function cleanupMissingImages() {
  try {
    console.log('🔍 이미지 파일이 없는 배경화면 데이터를 찾는 중...');
    
    // wallpapers.json 파일 읽기
    const wallpapersData = JSON.parse(fs.readFileSync(WALLPAPERS_JSON_PATH, 'utf8'));
    console.log(`📊 총 ${wallpapersData.length}개의 배경화면 데이터 발견`);
    
    const validWallpapers = [];
    const invalidWallpapers = [];
    
    for (const wallpaper of wallpapersData) {
      let hasValidImages = true;
      const missingFiles = [];
      
      // 각 해상도의 이미지 파일 존재 여부 확인
      for (const resolution of wallpaper.resolutions) {
        const fileUrl = resolution.fileUrl;
        let filePath;
        
        if (fileUrl.startsWith('http://localhost:3001/uploads/') || fileUrl.startsWith('http://localhost:3002/uploads/')) {
          // 새로운 업로드 방식 (루트 uploads 디렉토리)
          const filename = fileUrl.split('/uploads/')[1];
          filePath = path.join(UPLOADS_DIR, filename);
        } else if (fileUrl.startsWith('/uploads/')) {
          // 기존 방식 (상대 경로)
          const relativePath = fileUrl.substring(1); // '/uploads/' -> 'uploads/'
          filePath = path.join(__dirname, relativePath);
        } else {
          console.log(`⚠️  알 수 없는 파일 URL 형식: ${fileUrl}`);
          hasValidImages = false;
          missingFiles.push(fileUrl);
          continue;
        }
        
        if (!fs.existsSync(filePath)) {
          hasValidImages = false;
          missingFiles.push(filePath);
        }
      }
      
      // 썸네일 파일 확인
      if (wallpaper.thumbnailUrl) {
        const thumbnailUrl = wallpaper.thumbnailUrl;
        let thumbnailPath;
        
        if (thumbnailUrl.startsWith('http://localhost:3001/uploads/') || thumbnailUrl.startsWith('http://localhost:3002/uploads/')) {
          const filename = thumbnailUrl.split('/uploads/')[1];
          thumbnailPath = path.join(UPLOADS_DIR, filename);
        } else if (thumbnailUrl.startsWith('/uploads/')) {
          const relativePath = thumbnailUrl.substring(1);
          thumbnailPath = path.join(__dirname, relativePath);
        }
        
        if (thumbnailPath && !fs.existsSync(thumbnailPath)) {
          hasValidImages = false;
          missingFiles.push(thumbnailPath);
        }
      }
      
      if (hasValidImages) {
        validWallpapers.push(wallpaper);
      } else {
        invalidWallpapers.push({
          id: wallpaper.id,
          title: wallpaper.title,
          missingFiles
        });
      }
    }
    
    console.log(`✅ 유효한 배경화면: ${validWallpapers.length}개`);
    console.log(`❌ 무효한 배경화면: ${invalidWallpapers.length}개`);
    
    if (invalidWallpapers.length > 0) {
      console.log('\n🗑️  삭제될 배경화면 목록:');
      invalidWallpapers.forEach(wp => {
        console.log(`  - ${wp.title} (ID: ${wp.id})`);
        console.log(`    누락된 파일들:`);
        wp.missingFiles.forEach(file => {
          console.log(`      • ${file}`);
        });
      });
      
      // 백업 생성
      const backupPath = WALLPAPERS_JSON_PATH + '.backup.' + Date.now();
      fs.copyFileSync(WALLPAPERS_JSON_PATH, backupPath);
      console.log(`\n💾 백업 파일 생성: ${backupPath}`);
      
      // 유효한 배경화면만으로 파일 업데이트
      fs.writeFileSync(WALLPAPERS_JSON_PATH, JSON.stringify(validWallpapers, null, 2));
      console.log(`\n✨ wallpapers.json 파일이 업데이트되었습니다.`);
      console.log(`   ${wallpapersData.length}개 → ${validWallpapers.length}개 (${invalidWallpapers.length}개 삭제)`);
    } else {
      console.log('\n🎉 모든 배경화면 데이터가 유효합니다!');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  cleanupMissingImages();
}

module.exports = { cleanupMissingImages };