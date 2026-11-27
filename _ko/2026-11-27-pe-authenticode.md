---
title: "PE 서명 쉽게 이해하기 - Authenticode(코드 서명)"
date: 2026-11-27
category: "Windows Internals"
group: "PE Signing"
weight: 4
ref: pe-authenticode
tags: [Windows, PE, Authenticode, Signing]
summary: "Authenticode(코드 서명)의 서명 블록이 PE 파일 어디에 있는지, 서명이 실제로 보증하는 범위는 어디까지인지, 그리고 Windows가 그 서명을 어떻게 검증하는지 정리한 연구 노트."
---

* TOC
{:toc}

## 한 줄 요약

Windows 실행 파일(PE)에 붙이는 코드 서명의 정식 이름은 **Authenticode**다. 이 서명은 결국 "파일 안의 또 다른 영역"일 뿐이라서, 통째로 복사해 다른 파일에 붙이는 건 어렵지 않다. 하지만 서명은 **원래 파일 내용에 대한 서명**이라서, 다른 파일로 옮겨 붙여도 그 파일 내용과는 절대 맞지 않는다. 왜 그런지, 그리고 Windows가 이걸 어떻게 확인하는지 정리한다.

## 서명은 파일 어디에 있나

PE 파일의 끝부분을 그려 보면 이렇다.

```
[DOS 헤더][NT 헤더][섹션: 코드/데이터 ...]   <- 여기까지가 "실제 실행 내용"
[WIN_CERTIFICATE 헤더][서명 데이터]  <- 파일 맨 끝에 붙는 서명 블록
```

OptionalHeader 안의 DataDirectory 테이블에서 **4번 엔트리**(`IMAGE_DIRECTORY_ENTRY_SECURITY`)가 서명 블록의 위치를 가리킨다.

다른 엔트리들은 전부 메모리에 로드된 뒤의 위치(RVA)를 가리키는데, 이 서명 엔트리만 예외로 **파일 오프셋**을 가리킨다. 서명 블록은 실행할 때 메모리에 올라가지 않으니까 파일 위치로 가리키면 충분하기 때문이다.

## 서명 블록 안에 뭐가 있나

서명 블록 맨 앞에는 작은 헤더(`WIN_CERTIFICATE`)가 있고, 그 뒤에 실제 서명 데이터가 온다.

```c
typedef struct _WIN_CERTIFICATE {
  DWORD dwLength;
  WORD  wRevision;
  WORD  wCertificateType;
  BYTE  bCertificate[ANYSIZE_ARRAY];
} WIN_CERTIFICATE, *LPWIN_CERTIFICATE;
```

- `dwLength` - 서명의 길이(바이트)
- `wRevision` - 인증서 수정 버전. `WIN_CERT_REVISION_1_0`(0x0100), `WIN_CERT_REVISION_2_0`(0x0200)
- `wCertificateType` - 인증서 유형 (아래 표)
- `bCertificate` - 인증서 배열. 형식은 `wCertificateType` 값에 따라 달라진다

| wCertificateType | 값 | 설명 |
|---|---|---|
| WIN_CERT_TYPE_X509 | 0x0001 | bCertificate에 X.509 인증서가 들어 있음 |
| WIN_CERT_TYPE_PKCS_SIGNED_DATA | 0x0002 | bCertificate에 PKCS SignedData 구조체가 들어 있음 |
| WIN_CERT_TYPE_RESERVED_1 | 0x0003 | 예약됨 |
| WIN_CERT_TYPE_PKCS1_SIGN | 0x0009 | bCertificate에 PKCS1_MODULE_SIGN 필드가 들어 있음 |

- 이 블록은 패딩을 포함해서 **8바이트 경계**에 맞춰야 한다.
- 드물게 블록 여러 개가 연달아 붙어 있을 수도 있다. (예: 예전 서명과 새 서명이 같이 들어 있는 경우)

## 서명이 실제로 보증하는 것 - 핵심

서명은 파일 전체를 보증하지 않는다. 서명을 만들 때 다음 부분은 일부러 계산에서 뺀다.

1. **CheckSum 필드** - 서명을 붙이면 이 값이 바뀔 수 있어서
2. **DataDirectory의 서명 엔트리(4번)** - 서명 블록 위치와 크기도 서명을 붙인 뒤에 정해져서
3. **서명 블록 자체** - 서명은 계산이 끝난 뒤 파일 끝에 붙으니까 자기 자신을 보증할 수 없어서

그러니까 서명이 말하는 건 이거다. **"위 부분들을 빼고 나머지는 서명할 때와 완전히 같다."**

그럼 서명 블록만 떼어서 다른 파일에 그대로 붙이면 어떻게 될까? 그 파일의 코드와 데이터는 원본과 완전히 다르다. 그런데 서명에는 이미 "원래 내용은 이거였다"는 해시가 고정되어 있다. 그래서 그 파일로 같은 계산을 다시 해 보면 서명이 주장하는 값과 절대 일치하지 않는다. 이게 바로 **해시 불일치(hash mismatch)**다.

## Windows가 확인하는 방법 (3단계)

1. 서명 블록이 있는지부터 확인한다.
2. 파일의 현재 내용으로 해시를 다시 계산해서 서명에 기록된 값과 비교한다. 다르면 실패.
3. 서명에 쓰인 인증서가 신뢰할 수 있는 발급자까지 체인으로 이어지는지 확인한다.

여기서 중요한 점이 하나 있다. 이걸 하는 함수 `WinVerifyTrust`는 HRESULT가 아니라 그냥 **LONG**을 돌려준다. `SUCCEEDED()`/`FAILED()` 같은 매크로로 판단하면 안 되고, **0이면 성공, 나머지는 전부 실패**로만 봐야 한다. 이걸 잘못 판단하면 2단계가 애초에 아무것도 걸러내지 못할 수도 있다.

## 체크섬은 별개 이야기

서명과 별개로 PE에는 체크섬 필드도 있다. 다만 이건 "항상" 검사하는 게 아니다.

- 일반 실행 파일(.exe)이나 보통 DLL을 실행할 때는 대개 이 체크섬을 보지 않는다.
- 드라이버, 부팅 때 로드되는 DLL, 중요한 Windows 프로세스에 로드되는 DLL은 로더가 실제로 체크섬을 검사한다.

그래서 체크섬이 틀리면 거부되는지 아닌지는 파일 종류와 로드되는 위치에 따라 달라진다.

## 테스트 소스 코드

- [Cert_Thief (GitHub)](https://github.com/LeeGwan/Cert_Thief.git)

## 참고

- [PE Format(MSDN)](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [WIN_CERTIFICATE 구조체(MSDN)](https://learn.microsoft.com/en-us/windows/win32/api/wintrust/ns-wintrust-win_certificate)
- [Understanding Executable File Signing(MSDN)](https://learn.microsoft.com/en-us/windows/win32/secbp/understanding-pe-signatures)
- [MS13-098: Authenticode 보안 강화 업데이트(MSRC)](https://www.microsoft.com/en-us/msrc/blog/2013/12/ms13-098-update-to-enhance-the-security-of-authenticode)
- [WinVerifyTrust 함수(MSDN)](https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-winverifytrust)
- [Certificate and Trust Return Values(MSDN)](https://learn.microsoft.com/en-us/windows/win32/seccrypto/certificate-and-trust-return-values)
