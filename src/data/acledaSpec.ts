export interface ApiDefinition {
  id: string;
  name: string;
  shortName: string;
  method: 'POST';
  endpoint: string;
  hashFormula: 'A' | 'B';
  hashVariables: string[];
  rootMerchantIdKey: 'merchantID' | 'merchantId';
  description: string;
  selectorDesc: string;
  requestTemplate: Record<string, any>;
  sampleResponse: Record<string, any>;
  fieldNotes: {
    field: string;
    description: string;
    type: string;
    rules: string;
  }[];
}

export const UAT_CONFIG = {
  host: 'https://epaymentuat.acledabank.com.kh:8443',
  port: '8443',
  defaultMerchantPath: 'XPAYTEST2024',
  defaultMerchantID: 'v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=',
  defaultLoginId: 'xpaytest2024',
  defaultSecretKey: 'xxxxx',
  uriTemplate: 'https://epaymentuat.acledabank.com.kh:8443/{MERCHANT_PATH}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/{ENDPOINT_NAME}',
};

export const API_DEFINITIONS: ApiDefinition[] = [
  {
    id: 'api-1-account',
    name: '1. Account / Wallet API',
    shortName: 'Account / Wallet',
    method: 'POST',
    endpoint: 'openSessionV2',
    hashFormula: 'A',
    hashVariables: ['merchantID', 'loginId', 'password', 'txid'],
    rootMerchantIdKey: 'merchantID',
    description: 'Opens an ACLEDA Account/Wallet payment session and returns sessionid & paymentTokenid to load the hosted Account/Wallet payment form.',
    selectorDesc: 'Inside xpayTransaction: "paymentCard": "0"',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      xpayTransaction: {
        txid: "261112075157562",
        purchaseAmount: "4000",
        purchaseCurrency: "KHR",
        purchaseDate: "12-11-2026",
        purchaseDesc: "mobile",
        invoiceid: "261112075157562",
        item: "1",
        quantity: "1",
        expiryTime: "5",
        paymentCard: "0"
      }
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        errorDetails: "SUCCESS",
        sessionid: "nkOLZzvy2yn3KUUm12PgkogQi3Ez",
        xTran: {
          purchaseAmount: 4000,
          purchaseDate: 1794444721774,
          quantity: 1,
          paymentTokenid: "1OaBWcfwvq0b2gOSLAzIylCfkqsz",
          expiryTime: 5,
          confirmDate: 0,
          purchaseType: 0,
          feeAmount: 0,
          operationType: 0
        }
      }
    },
    fieldNotes: [
      { field: 'paymentCard', description: 'Payment card indicator', type: 'String', rules: 'Must be "0" for Account/Wallet payment' },
      { field: 'merchantID', description: 'Merchant identification key', type: 'String', rules: 'Uppercase ID ("merchantID") at root level' },
      { field: 'hash', description: 'HMAC-SHA512 checksum', type: 'String (128 hex)', rules: 'HmacSHA512(merchantID + loginId + password + txid)' },
      { field: 'purchaseAmount', description: 'Transaction total', type: 'String', rules: 'Passed as a string in request; returned as number in response' },
      { field: 'purchaseCurrency', description: 'ISO currency code', type: 'String', rules: '"KHR" or "USD"' }
    ]
  },
  {
    id: 'api-2-mpgs',
    name: '2. MPGS Card API',
    shortName: 'MPGS Card',
    method: 'POST',
    endpoint: 'openSessionV2',
    hashFormula: 'A',
    hashVariables: ['merchantID', 'loginId', 'password', 'txid'],
    rootMerchantIdKey: 'merchantID',
    description: 'Initiates Mastercard Payment Gateway Services (MPGS) card payment session. Response echoes xTran.txid and xTran.paymentCard: "1".',
    selectorDesc: 'Inside xpayTransaction: "paymentCard": "1"',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      xpayTransaction: {
        txid: "261112075551819",
        purchaseAmount: "4000",
        purchaseCurrency: "KHR",
        purchaseDate: "12-11-2026",
        purchaseDesc: "mobile",
        invoiceid: "261112075551819",
        item: "1",
        quantity: "1",
        expiryTime: "5",
        paymentCard: "1"
      }
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        errorDetails: "SUCCESS",
        sessionid: "SONmdkHFcZQYQWrKDoxXwrD2GRUz",
        xTran: {
          txid: "261112075551819",
          purchaseAmount: 4000,
          purchaseDate: 1794444954017,
          quantity: 1,
          paymentTokenid: "MZ75oVuqaazp0wOpKCjO4ssqMoQz",
          expiryTime: 5,
          confirmDate: 0,
          purchaseType: 0,
          paymentCard: "1",
          feeAmount: 0,
          operationType: 0
        }
      }
    },
    fieldNotes: [
      { field: 'paymentCard', description: 'Payment card indicator', type: 'String', rules: 'Must be "1" for MPGS payment' },
      { field: 'result.xTran.txid', description: 'Echoed merchant txid', type: 'String', rules: 'Present in MPGS response (absent in Account/Wallet)' },
      { field: 'result.xTran.paymentCard', description: 'Echoed card flag', type: 'String', rules: 'Returned as "1"' }
    ]
  },
  {
    id: 'api-3-khqr-string',
    name: '3. KHQR String API',
    shortName: 'KHQR String (QR Code)',
    method: 'POST',
    endpoint: 'openSessionV2',
    hashFormula: 'A',
    hashVariables: ['merchantID', 'loginId', 'password', 'txid'],
    rootMerchantIdKey: 'merchantID',
    description: 'Single-call API that directly returns Bakong EMVCo KHQR payload (qrValue) and ready-to-render Base64 PNG image (qrBase64).',
    selectorDesc: 'Inside xpayTransaction: "operationType": "5" (omit paymentCard)',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      xpayTransaction: {
        txid: "261112080213742",
        purchaseAmount: "4000",
        purchaseCurrency: "KHR",
        purchaseDate: "12-11-2026",
        purchaseDesc: "mobile",
        invoiceid: "261112080213742",
        item: "1",
        quantity: "1",
        expiryTime: "5",
        operationType: "5"
      }
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        errorDetails: "SUCCESS",
        sessionid: "JbpiVQDzYKz7xdSjYDBHrdkQGPoz",
        xTran: {
          purchaseAmount: 4000,
          purchaseDate: 1794445386459,
          quantity: 1,
          paymentTokenid: "pxGkgEbblQ3nFXc2GbFFWfiWEZ8z",
          expiryTime: 5,
          confirmDate: 0,
          purchaseType: 0,
          feeAmount: 0,
          operationType: 0
        },
        qrValue: "00020101021230410009khqr@aclb0114000108111111210206ACLEDA3938001285512477217P0101703131794470886522520458145303116540440005802KH5906MYSHOP6010Phnom Penh62430124202611120803064596072145021101590051011993400131794445386522011317944456865226304B418",
        qrBase64: "iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVRIie3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBvA20QAAGm3dGZAAAAAElFTkSuQmCC"
      }
    },
    fieldNotes: [
      { field: 'operationType', description: 'Operation selector', type: 'String', rules: 'Must be "5". Omit paymentCard completely.' },
      { field: 'result.qrValue', description: 'Raw EMVCo KHQR String', type: 'String', rules: 'Official National Bank of Cambodia (NBC) Bakong KHQR format' },
      { field: 'result.qrBase64', description: 'Renderable PNG image', type: 'String', rules: 'data:image/png;base64,{qrBase64}' }
    ]
  },
  {
    id: 'api-4-khqr-webview',
    name: '4. KHQR Web View API',
    shortName: 'KHQR Web View',
    method: 'POST',
    endpoint: 'openSessionV2',
    hashFormula: 'A',
    hashVariables: ['merchantID', 'loginId', 'password', 'txid'],
    rootMerchantIdKey: 'merchantID',
    description: 'Opens a KHQR session for embedding ACLEDA Bank\'s hosted KHQR web page form (no qrValue or qrBase64 returned).',
    selectorDesc: 'Inside xpayTransaction: "operationType": "3" (omit paymentCard)',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      xpayTransaction: {
        txid: "261112080514696",
        purchaseAmount: "4000",
        purchaseCurrency: "KHR",
        purchaseDate: "12-11-2026",
        purchaseDesc: "mobile",
        invoiceid: "261112080514696",
        item: "1",
        quantity: "1",
        expiryTime: "5",
        operationType: "3"
      }
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        errorDetails: "SUCCESS",
        sessionid: "IGV93iTYsM8vqLe0PbRzXYLLcdMz",
        xTran: {
          purchaseAmount: 4000,
          purchaseDate: 1794445518992,
          quantity: 1,
          paymentTokenid: "CYLEz9HbYI7VttUxLKm4zLek8Koz",
          expiryTime: 5,
          confirmDate: 0,
          purchaseType: 0,
          feeAmount: 0,
          operationType: 0
        }
      }
    },
    fieldNotes: [
      { field: 'operationType', description: 'Operation selector', type: 'String', rules: 'Must be "3". Omit paymentCard completely.' },
      { field: 'result.sessionid', description: 'Web view session ID', type: 'String', rules: 'Used to initialize hosted web view payment iframe/redirect' }
    ]
  },
  {
    id: 'api-5-deeplink',
    name: '5. Deeplink API',
    shortName: 'Deeplink (App-to-App)',
    method: 'POST',
    endpoint: 'openSessionV2',
    hashFormula: 'A',
    hashVariables: ['merchantID', 'loginId', 'password', 'txid'],
    rootMerchantIdKey: 'merchantID',
    description: 'Generates universal deeplinkUrl to seamlessly launch the customer\'s installed ACLEDA Mobile app on iOS or Android.',
    selectorDesc: 'Inside xpayTransaction: oprDevice, callBackUrl, compName (omit paymentCard & operationType)',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      xpayTransaction: {
        txid: "261112080632514",
        purchaseAmount: "4000",
        purchaseCurrency: "KHR",
        purchaseDate: "12-11-2026",
        purchaseDesc: "mobile",
        invoiceid: "261112080632514",
        item: "1",
        quantity: "1",
        expiryTime: "5",
        oprDevice: "android",
        callBackUrl: "appmobile://merchant.com.kh/callback",
        compName: "My Shop Test"
      }
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        deeplinkUrl: "https://epaymentuat.acledabank.com.kh/acleda?partner_id=KUNTHABOP&ptid=XPAYTEST2024/ACKHQRaq5nhIk48IrclloubvzcXhrPKB0z&payment_data=++4nKwsZTimd3FiAYT1g6Spo07D0dx3uLwkK5...",
        errorDetails: "SUCCESS",
        sessionid: "83M8LP9sjECzLx14Hk2Eo4geboAz",
        xTran: {
          purchaseAmount: 4000,
          purchaseDate: 1794445598146,
          quantity: 1,
          paymentTokenid: "aq5nhIk48IrclloubvzcXhrPKB0z",
          expiryTime: 5,
          confirmDate: 0,
          purchaseType: 0,
          feeAmount: 0,
          operationType: 0
        }
      }
    },
    fieldNotes: [
      { field: 'oprDevice', description: 'Client mobile operating system', type: 'String', rules: '"android" or "ios"' },
      { field: 'callBackUrl', description: 'App redirect URI scheme', type: 'String', rules: 'e.g. appmobile://merchant.com.kh/callback' },
      { field: 'compName', description: 'Merchant brand display name', type: 'String', rules: 'Displayed inside ACLEDA Mobile transaction prompt' },
      { field: 'result.deeplinkUrl', description: 'Universal app deep link', type: 'String', rules: 'Direct deep link URL containing partner_id, ptid, payment_data' }
    ]
  },
  {
    id: 'api-6-status',
    name: '6. Get Transaction Status API',
    shortName: 'Get Status (Inquiry)',
    method: 'POST',
    endpoint: 'getTxnStatus',
    hashFormula: 'B',
    hashVariables: ['merchantId', 'loginId', 'password', 'paymentTokenid'],
    rootMerchantIdKey: 'merchantId',
    description: 'Authoritative server-to-server inquiry to verify payment settlement. Returns coreRefNum (FT...) on success, or -22 if expired.',
    selectorDesc: 'Flat JSON body: merchantName, merchantId (lowercase d), paymentTokenid (lowercase id)',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantName: "XPAYTEST2024",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      merchantId: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      paymentTokenid: "KTEeOOIVfqH0vX7cCvZnSAMuKqYz"
    },
    sampleResponse: {
      result: {
        TxDirection: 0,
        code: 0,
        coreRefNum: "FT2631610JVYSCLH",
        errorDetails: "SUCCESS",
        payerAccountNo: "0001******4504",
        transactionDate: "2026-11-12 08:13:41",
        xTran: {
          txid: "261112080907751",
          purchaseAmount: 4000,
          purchaseCurrency: "KHR",
          purchaseDate: 1794446021000,
          purchaseDesc: "mobile",
          invoiceid: "261112080907751",
          quantity: 0,
          paymentTokenid: "KTEeOOIVfqH0vX7cCvZnSAMuKqYz",
          expiryTime: 5,
          confirmDate: 1794446025000,
          purchaseType: 0,
          feeAmount: 0,
          operationType: 0
        },
        customerName: "Kimlloang UAT",
        mobileRef: "",
        paymentMethod: "acledapay"
      }
    },
    fieldNotes: [
      { field: 'paymentTokenid', description: 'Token ID from openSessionV2', type: 'String', rules: 'CRITICAL: Note lowercase "id". Fourth variable in Hash Formula B!' },
      { field: 'merchantId', description: 'Merchant ID key', type: 'String', rules: 'Note lowercase "d" ("merchantId", NOT "merchantID")' },
      { field: 'result.code', description: 'Settlement status code', type: 'Integer', rules: '0 = Paid/Success; -22 = Session Expired / Unpaid' },
      { field: 'result.coreRefNum', description: 'T24 Core Banking Reference', type: 'String', rules: 'Begins with "FT..." when successfully settled' },
      { field: 'result.xTran.confirmDate', description: 'Confirmation timestamp', type: 'Long (ms)', rules: 'Unix epoch ms (> 0 if paid, 0 if unpaid)' }
    ]
  },
  {
    id: 'api-7-refund',
    name: '7. Refund API',
    shortName: 'Refund Transaction',
    method: 'POST',
    endpoint: 'refundTxn',
    hashFormula: 'B',
    hashVariables: ['merchantId', 'loginId', 'password', 'paymentTokenId'],
    rootMerchantIdKey: 'merchantId',
    description: 'Refunds a previously settled transaction. Strict rules: currency must match original, amount <= refundable balance, original must be paid.',
    selectorDesc: 'Flat JSON body: paymentTokenId (uppercase I), sessionId (uppercase I), amount, currency, reason',
    requestTemplate: {
      loginId: "xpaytest2024",
      password: "<YOUR_PASSWORD>",
      merchantId: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
      hash: "AUTO_GENERATED_HASH_128_CHARS",
      paymentTokenId: "XM1O0NgzHqGDGcGBlYDzmHtszIQz",
      sessionId: "C9zF1hmAwhN034o7pARwxrrMfL8z",
      amount: "1",
      currency: "USD",
      reason: "Cancelled order"
    },
    sampleResponse: {
      result: {
        code: 334845,
        message: "This transaction is not available for refund. Please contact bank!",
        status: -1
      }
    },
    fieldNotes: [
      { field: 'paymentTokenId', description: 'Token ID from openSessionV2', type: 'String', rules: 'CRITICAL: Note UPPERCASE "I" ("paymentTokenId", unlike getTxnStatus)' },
      { field: 'sessionId', description: 'Session ID from openSessionV2', type: 'String', rules: 'Note UPPERCASE "I" ("sessionId")' },
      { field: 'currency', description: 'Refund currency', type: 'String', rules: 'MUST strictly match original purchaseCurrency ("USD" or "KHR")' },
      { field: 'amount', description: 'Refund amount string', type: 'String', rules: 'Cannot exceed remaining refundable balance' },
      { field: 'result.code', description: 'Refund outcome code', type: 'Integer', rules: '0 = Success; 334845 = Not refundable/Unpaid; -99 = Currency or amount mismatch' }
    ]
  }
];

export const COMMON_PITFALLS = [
  {
    id: 'port-8443',
    title: 'Missing Port 8443 in UAT URL',
    severity: 'High',
    description: 'UAT endpoint runs strictly on port 8443. Calling standard https port 443 will timeout or return SSL handshake errors.',
    solution: 'Use https://epaymentuat.acledabank.com.kh:8443/{MERCHANT_PATH}/...'
  },
  {
    id: 'secret-in-body',
    title: 'Sending Secret Key in Request JSON',
    severity: 'Critical',
    description: 'Never transmit secret key over the wire. ACLEDA has no hash endpoint; hashing must be computed purely on merchant backend.',
    solution: 'Compute HMAC-SHA512 locally and only send the generated "hash" field.'
  },
  {
    id: 'wrong-hash-formula',
    title: 'Formula A vs Formula B Confusion',
    severity: 'Critical',
    description: 'openSessionV2 uses Formula A (txid as 4th param). getTxnStatus & refundTxn use Formula B (paymentTokenId as 4th param).',
    solution: 'Formula A: merchantID + loginId + password + txid. Formula B: merchantId + loginId + password + paymentTokenId.'
  },
  {
    id: 'casing-merchant-id',
    title: 'merchantID vs merchantId Casing',
    severity: 'High',
    description: 'openSessionV2 requires uppercase "merchantID". getTxnStatus and refundTxn require lowercase d: "merchantId".',
    solution: 'Ensure your serializer or DTO uses the exact case expected per endpoint.'
  },
  {
    id: 'casing-payment-token',
    title: 'paymentTokenid vs paymentTokenId Casing',
    severity: 'Medium',
    description: 'getTxnStatus requires lowercase "paymentTokenid", whereas refundTxn requires camelCase "paymentTokenId".',
    solution: 'Match the exact casing in your request payloads.'
  },
  {
    id: 'khqr-selectors',
    title: 'KHQR Conflict (paymentCard vs operationType)',
    severity: 'High',
    description: 'For KHQR String (5) and KHQR Web View (3), you must OMIT paymentCard. Do not pass both paymentCard and operationType.',
    solution: 'Delete paymentCard key when setting operationType: "5" or "3".'
  },
  {
    id: 'frontend-redirect-trust',
    title: 'Trusting Frontend URL Callback for Payment Fulfillment',
    severity: 'Critical',
    description: 'Return page query params (_paymentresult=SUCCESS) can be spoofed by users or attackers altering browser location.',
    solution: 'Always take _paymenttokenid and call backend getTxnStatus to verify result.code == 0 and record FT... coreRefNum.'
  }
];

export const RETURN_REDIRECT_SPEC = {
  description: 'When payment completes on ACLEDA hosted form, the customer browser is redirected to merchant Return URL with query parameters:',
  exampleUrl: 'https://myshop.com.kh/order/callback?status=success&_arNo=261112082133413&_transactionid=261112082133413&_paymentresult=SUCCESS&_paymenttokenid=XM1O0NgzHqGDGcGBlYDzmHtszIQz&_resultCode=0',
  params: [
    { key: 'status', meaning: 'Session state flag', example: 'success' },
    { key: '_arNo', meaning: 'Merchant invoice ID (invoiceid)', example: '261112082133413' },
    { key: '_transactionid', meaning: 'Merchant transaction ID (txid)', example: '261112082133413' },
    { key: '_paymentresult', meaning: 'User result display status', example: 'SUCCESS' },
    { key: '_paymenttokenid', meaning: 'ACLEDA Payment Token ID (used to query getTxnStatus)', example: 'XM1O0NgzHqGDGcGBlYDzmHtszIQz' },
    { key: '_resultCode', meaning: 'Result code returned from payment form', example: '0' }
  ]
};
