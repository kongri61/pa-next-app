# 수동 배포 가이드

## 1. 빌드 생성

```bash
npm run build
```

## 2. 빌드 결과 확인

`build` 폴더에 다음 파일들이 생성됩니다:
- `index.html`
- `static/` 폴더 (CSS, JS, 이미지 등)

## 3. 웹 서버 업로드

### Apache 서버

1. `build` 폴더의 모든 내용을 웹 서버의 루트 디렉토리에 업로드
2. `.htaccess` 파일 생성 (SPA 라우팅 지원):

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Nginx 서버

1. `build` 폴더의 모든 내용을 웹 서버의 루트 디렉토리에 업로드
2. Nginx 설정 파일에 다음 추가:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### cPanel 호스팅

1. cPanel File Manager에서 `public_html` 폴더로 이동
2. `build` 폴더의 모든 파일을 업로드
3. `.htaccess` 파일 생성 (위의 Apache 설정과 동일)

## 4. 환경 변수 설정

웹 서버에서 환경 변수를 설정할 수 없는 경우, `build/index.html` 파일을 직접 수정:

```html
<script>
  window.REACT_APP_GOOGLE_MAPS_API_KEY = 'your_actual_api_key';
  window.REACT_APP_ADMIN_MODE = 'false';
</script>
```

## 5. SSL 인증서 설정

HTTPS를 위해 SSL 인증서를 설정하세요.

## 6. 도메인 설정

DNS 설정에서 도메인을 웹 서버 IP로 연결하세요. 