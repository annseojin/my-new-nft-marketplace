# My NFT Marketplace 사용 가이드

## 📋 개요

이 프로젝트는 Sepolia 테스트넷에서 운영되는 NFT 마켓플레이스입니다. 사용자는 NFT를 민팅하고, 마켓플레이스에서 NFT를 구매/판매할 수 있습니다.

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정해주세요:

```env
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id (선택사항)
```

**Pinata JWT 토큰 발급 방법:**

1. [Pinata](https://www.pinata.cloud/)에 가입
2. API Keys 메뉴에서 JWT 토큰 생성
3. 생성된 JWT 토큰을 `.env.local`에 설정

**WalletConnect Project ID 발급 방법 (선택사항):**

> **참고**: WalletConnect Project ID는 선택사항입니다. 설정하지 않아도 MetaMask와 Injected 지갑(브라우저 확장 지갑)은 정상적으로 작동합니다. WalletConnect를 통해 모바일 지갑을 연결하려는 경우에만 필요합니다.

1. [WalletConnect Cloud](https://cloud.walletconnect.com/)에 접속
2. "Sign In" 또는 "Get Started" 클릭하여 계정 생성/로그인
3. 대시보드에서 "Create New Project" 클릭
4. 프로젝트 정보 입력:
   - **Project Name**: 원하는 프로젝트 이름 (예: "My NFT Marketplace")
   - **Homepage URL**: 프로젝트 홈페이지 URL (예: `http://localhost:3000` 또는 실제 도메인)
   - **Allowed Domains**: 허용할 도메인 추가 (예: `localhost:3000`, `yourdomain.com`)
5. "Create" 클릭하여 프로젝트 생성
6. 생성된 프로젝트의 **Project ID**를 복사
7. `.env.local` 파일에 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`로 설정

**예시:**

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=1234567890abcdef1234567890abcdef
```

**설정 후:**

- 개발 서버를 재시작해야 환경 변수가 적용됩니다
- WalletConnect를 통한 모바일 지갑 연결이 가능해집니다

**커스텀 RPC URL 설정 (선택사항):**

RPC 요청 타임아웃 문제가 발생하는 경우, 더 안정적인 RPC 엔드포인트를 사용할 수 있습니다.

`.env.local` 파일에 다음을 추가:

```env
# Infura API 키가 있는 경우 (권장)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY

# 또는 Alchemy API 키 사용
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
```

**Infura API 키 발급 방법:**

1. [Infura](https://www.infura.io/)에 가입
2. 새 프로젝트 생성
3. Sepolia 네트워크 선택
4. API Key 복사하여 위의 URL에 설정

**참고:**

- RPC URL을 설정하지 않으면 기본적으로 여러 공개 RPC 엔드포인트를 fallback으로 사용합니다
- 타임아웃이 발생하면 자동으로 다른 RPC로 재시도합니다 (10초 타임아웃, 2번 재시도)

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어주세요.

## 🔧 주요 기능

### 1. 지갑 연결

- MetaMask 또는 기타 Web3 지갑을 연결할 수 있습니다
- Sepolia 테스트넷으로 자동 전환됩니다

### 2. NFT 민팅 ✅

* `MyNFT` 컨트랙트에는 관리자 전용 `safeMint` 함수가 존재합니다
* **추가로, 누구나 민팅 가능한 `publicMint(string tokenURI)` 함수가 구현되었습니다** ✅
* 일반 사용자는 `publicMint`를 통해 NFT를 직접 민팅할 수 있습니다

**현재 구현된 민팅 프로세스 (확장 반영):**

1. 이미지 파일 선택
2. NFT 이름과 설명 입력
3. 이미지를 IPFS에 업로드
4. 메타데이터(JSON)를 생성하고 IPFS에 업로드
5. **`publicMint(tokenURI)` 함수 호출 → 민팅 완료** ✅

> `safeMint`는 관리자(컨트랙트 소유자)용으로 유지됩니다.

---

### 3. 마켓플레이스

#### 판매 중인 NFT 조회

- 마켓플레이스에 등록된 모든 NFT를 조회합니다
- NFT 이미지, 이름, 가격을 확인할 수 있습니다

#### NFT 구매 (MTK 토큰 사용) ✅

1. 구매하려는 NFT의 "구매하기" 버튼 클릭
2. **ERC-20 토큰(MTK) allowance가 부족한 경우 자동 승인 처리** ✅
3. 구매 트랜잭션 확인 후 NFT 소유권이 이전됩니다

> 모든 NFT 거래는 **ERC-20 토큰(MTK)만을 결제 수단으로 사용**합니다.

#### NFT 판매 등록

1. "내 NFT" 섹션에서 보유한 NFT 확인
2. 판매 가격 입력 (MTK 토큰 단위)
3. "판매 등록" 버튼 클릭
4. NFT 승인 후 판매 등록 완료

#### 판매 취소

- 자신이 등록한 NFT의 판매를 취소할 수 있습니다

## 💡 사용 팁

### Sepolia 테스트넷 ETH 받기

1. [Sepolia Faucet](https://sepoliafaucet.com/)에서 테스트 ETH를 받으세요
2. 또는 [Alchemy Faucet](https://sepoliafaucet.com/) 사용

### MyToken (MTK) 토큰 받기

- MyToken 컨트랙트에서 직접 토큰을 받거나
- 다른 사용자로부터 토큰을 받아야 합니다
- 마켓플레이스에서 NFT를 구매하려면 MTK 토큰이 필요합니다

**옵션 1: 컨트랙트 수정 (권장)**

```solidity
function safeMint(address to, string memory _tokenURI) public {
    // onlyOwner 제거
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, _tokenURI);
}
```

**옵션 2: 별도의 공개 민팅 함수 추가**

```solidity
function publicMint(address to, string memory _tokenURI) public {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, _tokenURI);
}
```
### MyToken (MTK) 토큰 받기  (Faucet 기능 추가)

* **TokenFaucet 컨트랙트를 통해 MTK 토큰을 1회 지급받을 수 있습니다** 
* `내 프로필(Profile)` 탭에서 **“토큰 받기” 버튼**을 통해 신청
* **지갑 주소당 1회 제한**
* 지급된 MTK 토큰은 NFT 구매에 사용됩니다

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Providers 포함)
│   ├── page.tsx             # 메인 페이지
│   └── globals.css          # 전역 스타일
├── components/
│   ├── WalletConnect.tsx    # 지갑 연결 컴포넌트
│   ├── MintNFT.tsx          # NFT 민팅 컴포넌트
│   ├── Marketplace.tsx      # 마켓플레이스 컴포넌트
│   ├── Profile.tsx          # MTK Faucet / 잔액 조회 / 토큰 전송
│   ├── ContractInfo.tsx     # 컨트랙트 주소 / Etherscan 링크
│   └── providers.tsx        # Wagmi Provider
└── lib/
    ├── constants.ts         # 컨트랙트 주소 및 설정
    ├── contracts.ts         # 컨트랙트 상호작용 함수
    ├── ipfs.ts              # IPFS 업로드 유틸리티
    ├── wagmi.ts             # Wagmi 설정
    ├── nftAbi.json          # NFT 컨트랙트 ABI
    ├── marketplaceAbi.json  # 마켓플레이스 컨트랙트 ABI
    ├── tokenAbi.json        # 토큰 컨트랙트 ABI
    └── faucetAbi.json
```

## 🔍 트러블슈팅

### 지갑 연결이 안 될 때

- MetaMask가 설치되어 있는지 확인
- Sepolia 테스트넷이 추가되어 있는지 확인
- 브라우저를 새로고침

### 트랜잭션 실패

- Sepolia ETH 잔액 확인
- 가스비가 충분한지 확인
- 컨트랙트 권한 확인 (예: NFT 소유권, 토큰 승인 등)

### IPFS 업로드 실패

- `.env.local`에 Pinata JWT가 올바르게 설정되었는지 확인
- Pinata API 할당량 확인

### NFT 목록이 보이지 않을 때

- "새로고침" 버튼 클릭
- 네트워크가 Sepolia인지 확인
- 컨트랙트 주소가 올바른지 확인

## 📝 참고사항

- 이 프로젝트는 **Sepolia 테스트넷**에서만 작동합니다
- 모든 거래는 테스트 토큰으로 이루어집니다
- IPFS에 업로드된 데이터는 영구적으로 저장됩니다
- 컨트랙트 주소는 `src/lib/constants.ts`에서 확인할 수 있습니다

## 🛠️ 기술 스택

- **Next.js 16**: React 프레임워크
- **Wagmi v2**: Ethereum 상호작용 라이브러리
- **Viem**: Ethereum 유틸리티 라이브러리
- **Pinata**: IPFS 핀닝 서비스
- **Tailwind CSS**: 스타일링

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 브라우저 콘솔 오류 메시지
2. MetaMask 트랜잭션 로그
3. Sepolia Etherscan에서 트랜잭션 상태 확인
