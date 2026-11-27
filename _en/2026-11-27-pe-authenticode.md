---
title: "Understanding PE Signing, the Easy Way: Authenticode (Code Signing)"
date: 2026-11-27
category: "Windows Internals"
group: "PE Signing"
weight: 4
ref: pe-authenticode
tags: [Windows, PE, Authenticode, Signing]
summary: "A research note on where the Authenticode (code signing) signature block is in a PE file, what the signature actually covers, and how Windows verifies it."
---

* TOC
{:toc}

## One-line summary

The official name for code signing on Windows executables (PE files) is **Authenticode**. A signature is really just "another region inside the file," so copying the whole block onto a different file isn't hard. But the signature is a signature of the **original file's contents**, so even after you move it onto another file it will never match that file's contents. This note goes through why that is, and how Windows checks it.

## Where the signature lives in the file

Picture the layout at the end of a PE file:

```
[DOS header][NT headers][sections: code/data ...]   <- the "real executable content"
[WIN_CERTIFICATE header][signature data (PKCS#7)]   <- signature block at the very end
```

Inside the OptionalHeader, the DataDirectory table's **entry #4** (`IMAGE_DIRECTORY_ENTRY_SECURITY`) points to the signature block.

Every other entry points to a location in memory after loading (an RVA), but this one is the exception: it holds a **file offset**. The signature block is never loaded into memory at runtime, so a file position is all it needs.

## What's inside the signature block

The block starts with a small header (`WIN_CERTIFICATE`), followed by the actual signature data.

```c
typedef struct _WIN_CERTIFICATE {
  DWORD dwLength;
  WORD  wRevision;
  WORD  wCertificateType;
  BYTE  bCertificate[ANYSIZE_ARRAY];
} WIN_CERTIFICATE, *LPWIN_CERTIFICATE;
```

- `dwLength` - length of the signature in bytes
- `wRevision` - certificate revision. `WIN_CERT_REVISION_1_0` (0x0100), `WIN_CERT_REVISION_2_0` (0x0200)
- `wCertificateType` - certificate type (see table below)
- `bCertificate` - an array of certificates; its format depends on the value of `wCertificateType`

| wCertificateType | Value | Meaning |
|---|---|---|
| WIN_CERT_TYPE_X509 | 0x0001 | bCertificate contains an X.509 certificate |
| WIN_CERT_TYPE_PKCS_SIGNED_DATA | 0x0002 | bCertificate contains a PKCS SignedData structure |
| WIN_CERT_TYPE_RESERVED_1 | 0x0003 | Reserved |
| WIN_CERT_TYPE_PKCS1_SIGN | 0x0009 | bCertificate contains PKCS1_MODULE_SIGN fields |

- The block must be aligned to an **8-byte boundary**, padding included.
- In rare cases several blocks sit back-to-back (for example, when an older and a newer signature are both included).

## What the signature actually covers - the key part

The signature does not cover the whole file. When it is created, these parts are left out of the calculation on purpose:

1. **The CheckSum field** - its value can change once a signature is attached
2. **DataDirectory entry #4 (the certificate table entry)** - the block's location and size are only known after signing
3. **The signature block itself** - it is appended after the hash is computed, so it can't cover itself

So what the signature really says is: **"Everything except those parts is exactly the same as when I was signed."**

What happens if you pull the signature block off and attach it, as-is, to a different file? That file's code and data are completely different from the original, but the signature has already locked in "the original contents were this." Run the same calculation over the new file and the result can never match the value the signature claims. That is a **hash mismatch**.

## How Windows checks it (3 steps)

1. Check whether a signature block is present at all.
2. Recompute the hash over the file's current contents and compare it with the value recorded in the signature. If they differ, fail.
3. Check that the signing certificate chains up to a trusted issuer.

One important detail: the function that does this, `WinVerifyTrust`, returns a plain **LONG**, not an HRESULT. Don't judge it with `SUCCEEDED()`/`FAILED()`; treat it strictly as **0 means success, anything else means failure**. Get this wrong and step 2 may never filter anything out in the first place.

## The checksum is a separate story

Apart from the signature, a PE also has a checksum field, but it isn't checked all the time.

- When running a normal executable (.exe) or an ordinary DLL, the checksum usually isn't looked at.
- For drivers, DLLs loaded at boot, and DLLs loaded into critical Windows processes, the loader does check it.

So whether a wrong checksum gets a file rejected depends on the file's kind and where it is being loaded.

## Test source code

- [Cert_Thief (GitHub)](https://github.com/LeeGwan/Cert_Thief.git)

## References

- [PE Format (MSDN)](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)
- [WIN_CERTIFICATE structure (MSDN)](https://learn.microsoft.com/en-us/windows/win32/api/wintrust/ns-wintrust-win_certificate)
- [Understanding Executable File Signing (MSDN)](https://learn.microsoft.com/en-us/windows/win32/secbp/understanding-pe-signatures)
- [MS13-098: Update to enhance the security of Authenticode (MSRC)](https://www.microsoft.com/en-us/msrc/blog/2013/12/ms13-098-update-to-enhance-the-security-of-authenticode)
- [WinVerifyTrust function (MSDN)](https://learn.microsoft.com/en-us/windows/win32/api/wintrust/nf-wintrust-winverifytrust)
- [Certificate and Trust Return Values (MSDN)](https://learn.microsoft.com/en-us/windows/win32/seccrypto/certificate-and-trust-return-values)
