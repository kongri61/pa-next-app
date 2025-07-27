# Vercel 배포 가이드

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

### 1. Vercel 대시보드 접속
- [Vercel 대시보드](https://vercel.com/dashboard)에 접속
- 프로젝트 `pa-next-app` 선택

### 2. 환경 변수 설정
**Settings** → **Environment Variables**에서 다음 설정:

```
Name: REACT_APP_GOOGLE_MAPS_API_KEY
Value: AIzaSyCgPbhfAQ9gZbn4SVZIJoiLeHeIZek3-Pk
Environment: Production, Preview, Development
```

### 3. 배포 재시작
환경 변수 설정 후 **Deployments** → **Redeploy** 클릭

## 문제 해결

### 구글 지도가 나타나지 않는 경우:
1. 환경 변수가 제대로 설정되었는지 확인
2. 브라우저 개발자 도구에서 콘솔 에러 확인
3. Google Maps API 키가 유효한지 확인

### 배포 실패 시:
1. 로그 확인: **Deployments** → **View Function Logs**
2. 빌드 로그 확인: **Deployments** → **View Build Logs**

## 확인 사항

- ✅ 환경 변수 설정 완료
- ✅ Google Maps API 키 설정
- ✅ 배포 재시작 완료
- ✅ 지도 정상 로드 확인 