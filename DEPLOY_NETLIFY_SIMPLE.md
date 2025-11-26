# Netlify 배포 가이드 (Vercel 대안)

## 🚀 가장 쉬운 방법

### 1단계: Netlify 계정 생성
1. [https://www.netlify.com](https://www.netlify.com) 접속
2. "Sign up" 클릭 → GitHub 계정으로 로그인 (가장 쉬움)

### 2단계: 프로젝트 배포

#### 방법 A: 드래그 앤 드롭 (가장 빠름)
1. 프로젝트 폴더에서 `npm run build` 실행
2. `build` 폴더를 찾기
3. [Netlify Drop](https://app.netlify.com/drop) 페이지로 이동
4. `build` 폴더를 드래그 앤 드롭
5. 배포 완료! URL 받기

#### 방법 B: GitHub 연동 (자동 배포)
1. Netlify 대시보드에서 "Add new site" → "Import an existing project"
2. GitHub 선택
3. 저장소 선택
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. "Deploy site" 클릭

### 3단계: 환경 변수 설정
1. Netlify 사이트 설정 → "Environment variables"
2. 다음 변수 추가:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY = 실제_API_키
   REACT_APP_ADMIN_MODE = false
   ```
3. "Save" 클릭
4. "Trigger deploy" → "Clear cache and deploy site" 클릭

### 4단계: 완료!
- 배포된 URL 확인
- 자동으로 HTTPS 적용됨
- 커스텀 도메인도 무료로 설정 가능

---

## 📝 Netlify의 장점

✅ **무료 플랜이 넉넉함**
- 대역폭: 100GB/월
- 빌드 시간: 300분/월
- 사이트 수: 무제한

✅ **자동 배포**
- GitHub 푸시 시 자동 배포
- Pull Request 미리보기

✅ **빠른 속도**
- 글로벌 CDN
- 무료 SSL 인증서

---

## 🔄 업데이트 배포

GitHub에 푸시하면 자동으로 배포됩니다!

또는 수동으로:
```bash
npm run build
# build 폴더를 Netlify에 드래그 앤 드롭
```

