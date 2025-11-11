# PC 사이트 동기화 및 검색 기능 흐름

## 📋 개요

이 사이트는 **PC 사이트와 Firebase를 통해 동기화**되며, **오로지 PC에서 등록한 자료를 검색하는 기능만** 제공합니다.

## 🔄 동기화 구조

### 1. 서버 구분

#### PC 메인 서버 (데이터 입력/수정 가능)
- 도메인: `localhost`, `192.168.219.105`, `*.vercel.app`
- 기능: 매물 추가, 수정, 삭제 가능
- 동작: Firebase에 데이터 저장

#### 모바일/검색 전용 서버 (읽기 전용)
- 도메인: 그 외 모든 도메인 (예: GitHub Pages)
- 기능: **검색만 가능** (추가/수정/삭제 불가)
- 동작: Firebase에서 데이터를 읽어와서 검색

### 2. 동기화 흐름

```
┌─────────────┐
│  PC 사이트  │
│ (localhost) │
└──────┬──────┘
       │
       │ 1. 매물 추가/수정/삭제
       ▼
┌─────────────┐
│  Firebase   │ ← 중앙 저장소
│  Firestore  │
└──────┬──────┘
       │
       │ 2. 실시간 동기화 (onSnapshot)
       ▼
┌─────────────┐
│ 모바일 사이트│
│ (검색 전용)  │
└─────────────┘
```

## 🔍 검색 기능 동작 과정

### 1. 데이터 로드 과정

```typescript
// src/utils/firebaseSync.ts - initialize()
1. Firebase 초기화
2. 서버 타입 감지 (PC vs 모바일)
3. 모바일 서버인 경우:
   - Firebase에서 모든 매물 데이터 로드
   - IndexedDB에 저장 (로컬 캐시)
   - 실시간 리스너 설정 (변경사항 자동 반영)
```

### 2. 검색 실행 과정

```typescript
// src/pages/HomePage.tsx - getFilteredProperties()
1. allProperties에서 검색 (Firebase에서 동기화된 데이터)
2. 검색 단계:
   - 1단계: 정확한 ID 매칭 (예: "P001")
   - 2단계: 숫자만 입력 시 P 접두사 매칭 (예: "1" → "P1", "P01", "P001")
   - 3단계: 제목/주소 부분 매칭
3. 필터 적용 (거래유형, 매물종류, 면적, 가격 등)
4. 결과 반환
```

### 3. 실시간 동기화

```typescript
// src/utils/firebaseSync.ts - setupRealTimeSync()
- Firebase onSnapshot 리스너로 실시간 감지
- PC에서 매물 추가/수정/삭제 시 자동 반영
- IndexedDB 자동 업데이트
- UI 자동 새로고침
```

## 📊 현재 구현 상태

### ✅ 구현된 기능

1. **PC/모바일 서버 자동 감지**
   ```typescript
   const isMainServer = window.location.hostname === 'localhost' || 
                       window.location.hostname === '192.168.219.105' ||
                       window.location.hostname.includes('vercel.app');
   ```

2. **모바일 서버에서 쓰기 차단**
   ```typescript
   if (!isMainServer) {
     throw new Error('모바일 서버에서는 매물 추가/수정/삭제가 불가능합니다.');
   }
   ```

3. **Firebase 실시간 동기화**
   - PC에서 변경 → Firebase 업데이트 → 모바일 자동 반영

4. **검색 기능**
   - ID 검색 (P001, 1, 01 등)
   - 제목/주소 검색
   - 필터 검색 (거래유형, 매물종류, 면적, 가격)

### 🔍 검색 가능한 데이터

- **PC에서 Firebase에 저장된 모든 매물**
- **실시간으로 동기화되는 최신 데이터**
- **IndexedDB에 캐시된 데이터** (오프라인 지원)

## 🎯 동작 확인 방법

### 1. 콘솔 로그 확인

브라우저 개발자 도구 콘솔에서 다음 로그를 확인할 수 있습니다:

```
🔥 Firebase 동기화 초기화 시작...
🌐 현재 호스트: [도메인]
🖥️ 메인 서버 여부: [true/false]
📱 모바일 서버 감지 - Firebase에서 데이터 로드
🔥 Firebase에서 [N]개 매물 로드됨
📱 Firebase → IndexedDB 동기화 완료
🔄 Firebase 실시간 업데이트 감지
🚀 검색 시작 v4.0: { 검색어: "...", 전체매물: [...] }
```

### 2. 데이터 흐름 확인

1. **PC에서 매물 추가**
   - 콘솔: `➕ addProperty 시작: P001`
   - 콘솔: `🔥 Firebase 동기화 완료: P001`

2. **모바일에서 자동 반영**
   - 콘솔: `🔄 Firebase 실시간 업데이트 감지`
   - 콘솔: `📝 매물 added: P001`
   - 콘솔: `✅ IndexedDB 업데이트 완료: P001`

3. **검색 실행**
   - 콘솔: `🚀 검색 시작 v4.0`
   - 콘솔: `🎯 최종 검색 결과 v4.0`

## ⚠️ 주의사항

1. **모바일 서버에서는 데이터 수정 불가**
   - 추가/수정/삭제 시도 시 에러 메시지 표시
   - "PC에서 수정해주세요" 안내

2. **오프라인 지원**
   - IndexedDB에 캐시된 데이터로 검색 가능
   - 온라인 복구 시 자동 동기화

3. **실시간 동기화 지연**
   - 네트워크 상태에 따라 1-2초 지연 가능
   - Firebase 연결 상태 확인 필요

## 🔧 문제 해결

### 검색 결과가 나오지 않는 경우

1. **Firebase 동기화 확인**
   ```javascript
   // 콘솔에서 실행
   firebaseSync.checkFirebaseData();
   ```

2. **IndexedDB 데이터 확인**
   ```javascript
   // 콘솔에서 실행
   const props = await IndexedDB.getAllProperties();
   console.log('IndexedDB 매물 수:', props.length);
   ```

3. **실시간 동기화 상태 확인**
   ```javascript
   // 콘솔에서 실행
   console.log(firebaseSync.getStatus());
   ```

### 동기화가 안 되는 경우

1. **Firebase 연결 확인**
   - 환경 변수 설정 확인
   - Firebase 콘솔에서 데이터 확인

2. **수동 동기화 실행**
   ```javascript
   // 콘솔에서 실행
   await firebaseSync.manualSync();
   ```

## 📝 요약

- ✅ **PC 사이트와 Firebase를 통한 동기화 구현됨**
- ✅ **모바일/검색 전용 서버에서 읽기 전용으로 작동**
- ✅ **PC에서 등록한 자료만 검색 가능**
- ✅ **실시간 동기화로 최신 데이터 자동 반영**
- ✅ **검색 기능 정상 작동 (ID, 제목, 주소, 필터)**

**모든 과정이 코드에 구현되어 있으며, 콘솔 로그를 통해 확인할 수 있습니다.**

