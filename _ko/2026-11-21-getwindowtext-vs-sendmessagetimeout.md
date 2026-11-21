---
title: "GetWindowTextW와 SendMessageTimeoutW 동작 비교"
date: 2026-11-21
category: "Windows Internals"
group: "Win32 Window"
weight: 2
ref: getwindowtext-vs-sendmessagetimeout
tags: [Windows, Win32, WinAPI]
summary: "다른 프로세스의 윈도우 제목을 조회할 때 GetWindowTextW와 SendMessageTimeoutW가 어떻게 다르게 동작하는지, 응답 지연 상황까지 테스트한 스터디 노트."
---

* TOC
{:toc}

## 1. 개요

`GetWindowTextW`와 `SendMessageTimeoutW`는 윈도우(HWND)의 텍스트를 확인할 때 사용할 수 있지만, 동작 방식에는 차이가 있습니다. 특히 **다른 프로세스의 윈도우**를 조회할 때 이 차이가 나타납니다.

## 2. 함수별 동작

| 함수 | 주요 동작 |
|------|----------|
| `GetWindowTextW` | 다른 프로세스의 일반적인 최상위 윈도우 제목을 조회할 때 대상 프로세스에 `WM_GETTEXT`를 직접 보내지 않고, 시스템이 관리하는 윈도우 텍스트를 가져옵니다. 따라서 대상 프로세스가 응답하지 않는 상황에서도 제목 조회가 가능합니다. |
| `SendMessageTimeoutW` | 지정한 메시지를 대상 윈도우로 전송하고, 설정한 시간 동안 응답을 기다립니다. 제한 시간 안에 응답하지 않으면 호출이 시간 초과로 실패할 수 있습니다. |

> ※ `GetWindowTextW`는 다른 프로세스의 모든 컨트롤 텍스트를 가져오는 용도가 아닙니다. 다른 프로세스의 사용자 정의 컨트롤처럼 실제 `WM_GETTEXT` 처리가 필요한 텍스트는 조회되지 않을 수 있습니다.

## 3. 테스트 결과

두 함수의 결과가 달라지는 대표적인 상황을 두 가지로 나누어 정리했습니다. 첫 번째는 윈도우 프로시저가 `WM_GETTEXT`를 직접 처리하는 경우이고, 두 번째는 대상 프로세스가 메시지에 응답하지 못하는 경우입니다.

### 3.1 윈도우 프로시저가 WM_GETTEXT를 직접 처리하는 경우

다음과 같이 `WM_GETTEXT`를 받으면 실제 윈도우 제목과 관계없이 항상 `"Booga!"`를 돌려주는 윈도우 클래스(`Sample`)가 있다고 가정합니다.

```c
SampleWndProc(...)
{
    case WM_GETTEXT:
        lstrcpyn((LPTSTR)lParam, "Booga!", (int)wParam);
        return lstrlen((LPTSTR)lParam);
    case WM_GETTEXTLENGTH: return 7; // lstrlen("Booga!") + null
    ...
}
```

애플리케이션 A는 이 클래스로 제목이 `"Frappy"`인 윈도우를 생성합니다.

```c
hwnd = CreateWindow("Sample", "Frappy", ...);
```

프로세스 B가 어떤 방법으로든 이 윈도우의 핸들을 얻은 뒤, 두 가지 방법으로 텍스트를 조회합니다.

```c
TCHAR szBuf[80];

GetWindowText(hwnd, szBuf, 80);                    // szBuf = "Frappy"
SendMessage(hwnd, WM_GETTEXT, 80, (LPARAM)szBuf);  // szBuf = "Booga!"
```

`GetWindowText`는 다른 프로세스의 윈도우에 `WM_GETTEXT`를 보내지 않고, 시스템이 별도로 보관하고 있는 윈도우 텍스트(`CreateWindow` 시 지정한 `"Frappy"`)를 읽어 오기 때문에 `"Frappy"`를 반환합니다. 반면 `SendMessage`로 `WM_GETTEXT`를 보내면 대상 윈도우 프로시저가 직접 응답하므로 `"Booga!"`를 받게 됩니다. `SendMessageTimeoutW`로 보내는 경우도 마찬가지입니다.

즉, 윈도우 프로시저가 `WM_GETTEXT`를 별도로 처리하는 컨트롤이라면 `GetWindowTextW`와 `SendMessageTimeoutW`의 결과가 서로 다를 수 있습니다.

### 3.2 대상 프로세스가 응답하지 못하는 경우

메모장(Notepad.exe)의 윈도우 제목을 대상으로, 프로그램이 정상적으로 응답하는 상태와 응답하지 않는 상태에서 `GetWindowTextW`와 `SendMessageTimeoutW`의 결과를 비교했습니다.

[![대상 프로그램이 정상적으로 응답하는 상태](/assets/img/win32-window/gettext_normal.png)](/assets/img/win32-window/gettext_normal.png)
*그림 1. 대상 프로그램이 정상적으로 응답하는 상태*

정상 상태에서는 `GetWindowTextW`와 `SendMessageTimeoutW` 모두 `GDI+ Window (Notepad.exe)`라는 윈도우 제목을 확인했습니다.

[![대상 프로그램이 응답하지 않는 상태](/assets/img/win32-window/gettext_hung.png)](/assets/img/win32-window/gettext_hung.png)
*그림 2. 대상 프로그램이 응답하지 않는 상태*

대상 프로그램이 일시 정지되어 메시지에 응답하지 않는 상태에서는 `GetWindowTextW`로 윈도우 제목을 계속 확인할 수 있었지만, `SendMessageTimeoutW`는 제한 시간 내 응답을 받지 못해 **TimeOut**으로 처리되었습니다.

## 4. 정리

다른 프로세스의 일반적인 윈도우 제목을 안정적으로 확인하려는 경우에는 `GetWindowTextW`를 사용할 수 있습니다. 반면 대상 윈도우가 직접 처리하는 `WM_GETTEXT` 결과가 필요한 경우에는 `SendMessageTimeoutW`를 고려할 수 있습니다. 다만 대상 프로그램이 응답하지 않으면 시간 초과가 발생할 수 있으므로, 제한 시간과 실패 처리 로직을 함께 구현해야 합니다.

## 참고

- [Raymond Chen, The Old New Thing – GetWindowText() is more complicated than you think](https://devblogs.microsoft.com/oldnewthing/20030821-00/?p=42833/)
- [GetWindowTextW 함수(MSDN)](https://learn.microsoft.com/ko-kr/windows/win32/api/winuser/nf-winuser-getwindowtextw)
- [SendMessageTimeoutW 함수(MSDN)](https://learn.microsoft.com/ko-kr/windows/win32/api/winuser/nf-winuser-sendmessagetimeoutw)
