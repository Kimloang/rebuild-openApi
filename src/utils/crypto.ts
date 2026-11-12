/**
 * Official ACLEDA Toanchet Pay HMAC-SHA512 Generator
 * Conforms 100% to ACLEDA's Java MerchantHashGenerator:
 * - HMAC-SHA512 algorithm
 * - UTF-8 string encoding
 * - 128-character uppercase Hexadecimal output (%02X)
 */

export async function generateHmacSHA512Hex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-512' } },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return hexString;
}

/**
 * Formula A — For all 5 openSessionV2 Payment APIs:
 * (Account/Wallet, MPGS, KHQR String, KHQR Web View, Deeplink)
 * message = merchantID + loginId + password + txid
 */
export function buildFormulaAMessage(merchantID: string, loginId: string, password: string, txid: string): string {
  return `${merchantID}${loginId}${password}${txid}`;
}

/**
 * Formula B — For getTxnStatus and refundTxn:
 * message = merchantId + loginId + password + paymentTokenId
 */
export function buildFormulaBMessage(merchantId: string, loginId: string, password: string, paymentTokenId: string): string {
  return `${merchantId}${loginId}${password}${paymentTokenId}`;
}
