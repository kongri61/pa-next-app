# Firebase Storage CORS 문제 해결 가이드

## 문제 상황
- 이미지 업로드 시 CORS 오류 발생
- `Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy`

## 해결 방법

### 1. Firebase Storage 보안 규칙 수정 (즉시 적용 가능)

Firebase 콘솔 (https://console.firebase.google.com)에서:

1. **프로젝트 선택**: `pa-realestate-sync-cb990`
2. **Storage** → **Rules** 탭
3. **현재 규칙을 다음으로 변경**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 모든 사용자가 읽기 가능
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // properties 폴더에 대한 쓰기 권한 (모든 사용자 허용)
    match /properties/{allPaths=**} {
      allow write: if true;
    }
  }
}
```

4. **"Publish" 버튼 클릭**

### 2. Firebase Storage CORS 설정 (Google Cloud SDK 필요)

Google Cloud SDK 설치 후:

```bash
# 1. Google Cloud SDK 설치
# https://cloud.google.com/sdk/docs/install

# 2. 인증
gcloud auth login

# 3. 프로젝트 설정
gcloud config set project pa-realestate-sync-cb990

# 4. CORS 설정 적용
gsutil cors set cors.json gs://pa-realestate-sync-cb990.firebasestorage.app
```

### 3. 대안: Firebase Storage 규칙만으로 해결

CORS 설정 없이도 Storage 규칙만으로 해결할 수 있습니다:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## 테스트 방법

1. Firebase Storage 규칙 수정 후
2. 웹사이트에서 이미지 업로드 테스트
3. 브라우저 개발자 도구 콘솔에서 오류 확인

## 예상 결과

- ✅ "🔥 Firebase Storage 업로드 시작"
- ✅ "📁 Storage 참조 생성"
- ✅ "⬆️ 파일 업로드 시작"
- ✅ "✅ 파일 업로드 완료"
- ✅ "🔗 다운로드 URL 생성 중"
- ✅ "✅ 다운로드 URL 생성 완료"

## 주의사항

- **개발/테스트용 규칙**: 프로덕션에서는 더 엄격한 규칙 사용 권장
- **보안**: 실제 서비스에서는 인증된 사용자만 업로드 가능하도록 설정
- **도메인 제한**: 특정 도메인에서만 업로드 가능하도록 제한 가능

## 추가 디버깅

브라우저 개발자 도구에서:
1. **Network 탭**: Firebase Storage 요청 상태 확인
2. **Console 탭**: 오류 메시지 확인
3. **Application 탭**: IndexedDB에 저장된 데이터 확인



