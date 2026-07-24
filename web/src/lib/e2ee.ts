import { Preferences } from '@capacitor/preferences';

const KEY_STORAGE_PREFIX = 'gamerhub_e2ee_';

export interface KeyPairJWK {
  publicKeyJWK: JsonWebKey;
  privateKeyJWK: JsonWebKey;
}

export interface UserKeysBundle {
  identityKey: KeyPairJWK;
  signingKey: KeyPairJWK;
}

export interface EncryptedMessagePayload {
  cipherText: string;
  iv: string;
  senderPublicKey: JsonWebKey;
  senderSigningKey: JsonWebKey;
  signature: string;
  isE2EE: boolean;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class E2EEEngine {
  private static identityKeyPair: CryptoKeyPair | null = null;
  private static signingKeyPair: CryptoKeyPair | null = null;
  private static initialized = false;

  public static async initialize(userId: string): Promise<UserKeysBundle> {
    const storageKey = `${KEY_STORAGE_PREFIX}${userId}`;
    let storedKeysStr: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      storedKeysStr = localStorage.getItem(storageKey);
    }
    if (!storedKeysStr) {
      const { value } = await Preferences.get({ key: storageKey });
      storedKeysStr = value;
    }

    if (storedKeysStr) {
      try {
        const bundle: UserKeysBundle = JSON.parse(storedKeysStr);
        this.identityKeyPair = {
          publicKey: await window.crypto.subtle.importKey('jwk', bundle.identityKey.publicKeyJWK, { name: 'ECDH', namedCurve: 'P-256' }, true, []),
          privateKey: await window.crypto.subtle.importKey('jwk', bundle.identityKey.privateKeyJWK, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']),
        };
        this.signingKeyPair = {
          publicKey: await window.crypto.subtle.importKey('jwk', bundle.signingKey.publicKeyJWK, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
          privateKey: await window.crypto.subtle.importKey('jwk', bundle.signingKey.privateKeyJWK, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']),
        };
        this.initialized = true;
        return bundle;
      } catch (err) {
        console.warn('Failed to parse existing E2EE keys, generating fresh keypair:', err);
      }
    }

    const ecdhKeyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const ecdsaKeyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    this.identityKeyPair = ecdhKeyPair;
    this.signingKeyPair = ecdsaKeyPair;
    this.initialized = true;

    const bundle: UserKeysBundle = {
      identityKey: {
        publicKeyJWK: await window.crypto.subtle.exportKey('jwk', ecdhKeyPair.publicKey),
        privateKeyJWK: await window.crypto.subtle.exportKey('jwk', ecdhKeyPair.privateKey),
      },
      signingKey: {
        publicKeyJWK: await window.crypto.subtle.exportKey('jwk', ecdsaKeyPair.publicKey),
        privateKeyJWK: await window.crypto.subtle.exportKey('jwk', ecdsaKeyPair.privateKey),
      },
    };

    const bundleJson = JSON.stringify(bundle);
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(storageKey, bundleJson); } catch {}
    }
    await Preferences.set({ key: storageKey, value: bundleJson });

    return bundle;
  }

  private static async deriveSharedKey(recipientPublicKeyJWK: JsonWebKey): Promise<CryptoKey> {
    if (!this.identityKeyPair) {
      throw new Error('E2EE Engine not initialized');
    }

    const recipientPublicKey = await window.crypto.subtle.importKey(
      'jwk',
      recipientPublicKeyJWK,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    return window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientPublicKey },
      this.identityKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public static async encryptMessage(
    plaintext: string,
    recipientPublicKeyJWK: JsonWebKey
  ): Promise<EncryptedMessagePayload> {
    if (!this.initialized || !this.identityKeyPair || !this.signingKeyPair) {
      throw new Error('E2EE Engine not initialized');
    }

    const sharedKey = await this.deriveSharedKey(recipientPublicKeyJWK);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedPlaintext = encoder.encode(plaintext);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encodedPlaintext
    );

    const cipherTextBase64 = bufferToBase64(cipherBuffer);
    const ivBase64 = bufferToBase64(iv.buffer);

    const sigPayload = encoder.encode(ivBase64 + cipherTextBase64);
    const signatureBuffer = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      this.signingKeyPair.privateKey,
      sigPayload
    );

    const signatureBase64 = bufferToBase64(signatureBuffer);
    const senderPublicKeyJWK = await window.crypto.subtle.exportKey('jwk', this.identityKeyPair.publicKey);
    const senderSigningKeyJWK = await window.crypto.subtle.exportKey('jwk', this.signingKeyPair.publicKey);

    return {
      cipherText: cipherTextBase64,
      iv: ivBase64,
      senderPublicKey: senderPublicKeyJWK,
      senderSigningKey: senderSigningKeyJWK,
      signature: signatureBase64,
      isE2EE: true,
    };
  }

  public static async decryptMessage(payload: EncryptedMessagePayload): Promise<string> {
    if (!this.initialized || !this.identityKeyPair) {
      throw new Error('E2EE Engine not initialized');
    }

    const senderPublicKey = await window.crypto.subtle.importKey(
      'jwk',
      payload.senderPublicKey,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: senderPublicKey },
      this.identityKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    if (payload.senderSigningKey && payload.signature) {
      try {
        const senderSigningKey = await window.crypto.subtle.importKey(
          'jwk',
          payload.senderSigningKey,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify']
        );
        const encoder = new TextEncoder();
        const sigPayload = encoder.encode(payload.iv + payload.cipherText);
        const signatureBuffer = base64ToBuffer(payload.signature);

        const isValidSig = await window.crypto.subtle.verify(
          { name: 'ECDSA', hash: { name: 'SHA-256' } },
          senderSigningKey,
          signatureBuffer,
          sigPayload
        );

        if (!isValidSig) {
          console.warn('E2EE Integrity Check Warning: ECDSA Signature verification failed');
        }
      } catch (sigErr) {
        console.warn('ECDSA Signature verification error:', sigErr);
      }
    }

    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const cipherBuffer = base64ToBuffer(payload.cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  public static async decryptIfNeeded(content: string | null | undefined): Promise<string> {
    if (!content) return '';
    try {
      if (content.startsWith('{') && content.includes('" isE2EE\:true')) {
 const payload: EncryptedMessagePayload = JSON.parse(content);
 return await this.decryptMessage(payload);
 }
 } catch (err) {
 console.warn('Could not decrypt message payload:', err);
 }
 return content;
 }
}
