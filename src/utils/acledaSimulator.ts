/**
 * ACLEDA Toanchet Pay Local Sandbox Simulator
 * Accurately simulates ACLEDA bank backend responses according to the master specification.
 */

import { generateHmacSHA512Hex, buildFormulaAMessage, buildFormulaBMessage } from './crypto';

export interface SimulatedResponse {
  status: number;
  statusText: string;
  durationMs: number;
  data: any;
  headers: Record<string, string>;
  isSimulated: boolean;
  notes?: string;
}

export async function simulateAcledaBackend(
  endpoint: string,
  payload: any,
  secretKey: string
): Promise<SimulatedResponse> {
  const startTime = Date.now();
  // Simulate 200-400ms network transit
  await new Promise((r) => setTimeout(r, 250));

  const headers = {
    'content-type': 'application/json;charset=UTF-8',
    'x-acleda-gateway': 'XPAYConnectorServiceInterfaceImplV2',
    date: new Date().toUTCString(),
  };

  const durationMs = Date.now() - startTime;

  // 1. Validate JSON presence
  if (!payload || typeof payload !== 'object') {
    return {
      status: 400,
      statusText: 'Bad Request',
      durationMs,
      data: { result: { code: -1, errorDetails: 'Invalid JSON request payload' } },
      headers,
      isSimulated: true,
    };
  }

  // 2. Validate Endpoint: openSessionV2
  if (endpoint === 'openSessionV2') {
    const xTran = payload.xpayTransaction;
    if (!xTran) {
      return {
        status: 400,
        statusText: 'Bad Request',
        durationMs,
        data: { result: { code: -1, errorDetails: 'Missing xpayTransaction object' } },
        headers,
        isSimulated: true,
      };
    }

    // Check merchantID casing
    const merchantID = payload.merchantID;
    if (!merchantID) {
      return {
        status: 400,
        statusText: 'Bad Request',
        durationMs,
        data: {
          result: {
            code: -10,
            errorDetails: 'Invalid merchantID (Note uppercase "merchantID" required)',
          },
        },
        headers,
        isSimulated: true,
      };
    }

    const txid = String(xTran.txid || '');
    const loginId = String(payload.loginId || '');
    const password = String(payload.password || '');

    // Verify Hash Formula A: merchantID + loginId + password + txid
    const expectedMsg = buildFormulaAMessage(merchantID, loginId, password, txid);
    const expectedHash = await generateHmacSHA512Hex(expectedMsg, secretKey);

    const receivedHash = String(payload.hash || '').toUpperCase();
    const hashMatches = receivedHash.length === 128 && receivedHash === expectedHash;

    const sessionId = 'nkOLZzvy2yn3KUUm12Pg' + Math.random().toString(36).substring(2, 10);
    const paymentTokenId = '1OaBWcfwvq0b2gOSLAzI' + Math.random().toString(36).substring(2, 10);
    const purchaseAmount = Number(xTran.purchaseAmount) || 4000;
    const expiryTime = Number(xTran.expiryTime) || 5;

    // Determine API variant:
    // API 3: KHQR String (operationType == "5")
    if (String(xTran.operationType) === '5') {
      const sampleBakongKHQR = `00020101021230410009khqr@aclb0114000108111111210206ACLEDA3938001285512477217P01017031317944708865225204581453031165404${purchaseAmount}5802KH5906MYSHOP6010Phnom Penh62430124202611120803064596072145021101590051011993400131794445386522011317944456865226304B418`;
      const sampleBase64PNG =
        'iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAALklEQVRIie3BMQEAAADCoPVPbQhfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBvA20QAAGm3dGZAAAAAElFTkSuQmCC';

      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            TxDirection: 0,
            code: hashMatches ? 0 : -3,
            errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH_OR_CREDENTIALS',
            sessionid: sessionId,
            xTran: {
              purchaseAmount,
              purchaseDate: Date.now(),
              quantity: Number(xTran.quantity) || 1,
              paymentTokenid: paymentTokenId,
              expiryTime,
              confirmDate: 0,
              purchaseType: 0,
              feeAmount: 0,
              operationType: 5,
            },
            qrValue: sampleBakongKHQR,
            qrBase64: sampleBase64PNG,
          },
        },
        headers,
        isSimulated: true,
        notes: hashMatches
          ? 'Hash verified with Formula A. Returning raw KHQR EMVCo string + Base64 PNG.'
          : `Note: Hash check failed. Expected: ${expectedHash.slice(0, 16)}...`,
      };
    }

    // API 4: KHQR Web View (operationType == "3")
    if (String(xTran.operationType) === '3') {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            TxDirection: 0,
            code: hashMatches ? 0 : -3,
            errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH_OR_CREDENTIALS',
            sessionid: sessionId,
            xTran: {
              purchaseAmount,
              purchaseDate: Date.now(),
              quantity: Number(xTran.quantity) || 1,
              paymentTokenid: paymentTokenId,
              expiryTime,
              confirmDate: 0,
              purchaseType: 0,
              feeAmount: 0,
              operationType: 3,
            },
          },
        },
        headers,
        isSimulated: true,
        notes: 'Session created for ACLEDA hosted KHQR Web View.',
      };
    }

    // API 5: Deeplink (oprDevice, callBackUrl, compName)
    if (xTran.oprDevice || xTran.callBackUrl) {
      const mockDeeplink = `https://epaymentuat.acledabank.com.kh/acleda?partner_id=XPAYTEST2024&ptid=XPAYTEST2024/${paymentTokenId}&payment_data=++4nKwsZTimd3FiAYT1g6Spo07D0dx3uLwkK5+Bgmy71fhDHrxacledabankSecurityTC87H5rSu3IYXq0vroPRoVacledabankSecurityTC8S5RWmGFQdncymzBH7lHYce341CODQ+YojwcqTlsJ63XaxBLRL2UW0u0u40a1+eFoH4zacledabankSecurityTC...`;
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            TxDirection: 0,
            code: hashMatches ? 0 : -3,
            deeplinkUrl: mockDeeplink,
            errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH_OR_CREDENTIALS',
            sessionid: sessionId,
            xTran: {
              purchaseAmount,
              purchaseDate: Date.now(),
              quantity: Number(xTran.quantity) || 1,
              paymentTokenid: paymentTokenId,
              expiryTime,
              confirmDate: 0,
              purchaseType: 0,
              feeAmount: 0,
              operationType: 0,
            },
          },
        },
        headers,
        isSimulated: true,
        notes: 'Universal mobile Deeplink generated for ACLEDA Mobile app.',
      };
    }

    // API 2: MPGS Card (paymentCard == "1")
    if (String(xTran.paymentCard) === '1') {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            TxDirection: 0,
            code: hashMatches ? 0 : -3,
            errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH_OR_CREDENTIALS',
            sessionid: sessionId,
            xTran: {
              txid,
              purchaseAmount,
              purchaseDate: Date.now(),
              quantity: Number(xTran.quantity) || 1,
              paymentTokenid: paymentTokenId,
              expiryTime,
              confirmDate: 0,
              purchaseType: 0,
              paymentCard: '1',
              feeAmount: 0,
              operationType: 0,
            },
          },
        },
        headers,
        isSimulated: true,
        notes: 'MPGS Card session initialized. Notice xTran echoes back txid and paymentCard: "1".',
      };
    }

    // API 1: Account / Wallet (paymentCard == "0" or default)
    return {
      status: 200,
      statusText: 'OK',
      durationMs,
      data: {
        result: {
          TxDirection: 0,
          code: hashMatches ? 0 : -3,
          errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH_OR_CREDENTIALS',
          sessionid: sessionId,
          xTran: {
            purchaseAmount,
            purchaseDate: Date.now(),
            quantity: Number(xTran.quantity) || 1,
            paymentTokenid: paymentTokenId,
            expiryTime,
            confirmDate: 0,
            purchaseType: 0,
            feeAmount: 0,
            operationType: 0,
          },
        },
      },
      headers,
      isSimulated: true,
      notes: 'Account / Wallet payment session initialized.',
    };
  }

  // 3. Validate Endpoint: getTxnStatus
  if (endpoint === 'getTxnStatus') {
    const merchantId = payload.merchantId;
    const loginId = payload.loginId;
    const password = payload.password;
    const paymentTokenid = payload.paymentTokenid;

    const expectedMsg = buildFormulaBMessage(merchantId, loginId, password, paymentTokenid);
    const expectedHash = await generateHmacSHA512Hex(expectedMsg, secretKey);
    const hashMatches =
      payload.hash && String(payload.hash).toUpperCase() === expectedHash;

    const isExpired = String(paymentTokenid).includes('EXPIRED') || paymentTokenid?.length < 15;

    if (isExpired) {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            TxDirection: 0,
            code: -22,
            coreRefNum: '202611121330438249266580',
            errorDetails: 'Transaction Expired By Session TimeOut!',
            payerAccountNo: 'Not-Available',
            transactionDate: '2026-11-12 13:30:43',
            xTran: {
              txid: '261112080907751',
              purchaseAmount: 4000,
              purchaseCurrency: 'KHR',
              purchaseDate: Date.now() - 360000,
              purchaseDesc: 'mobile',
              invoiceid: '261112080907751',
              quantity: 0,
              paymentTokenid,
              expiryTime: 5,
              confirmDate: 0,
              purchaseType: 0,
              feeAmount: 0.01,
              operationType: 0,
            },
            customerName: '',
            paymentMethod: 'khqr',
          },
        },
        headers,
        isSimulated: true,
        notes: 'Simulated expired/unpaid transaction (code -22, confirmDate 0).',
      };
    }

    // Success / Paid transaction
    const coreRefNum = 'FT' + Math.floor(Math.random() * 90000000 + 10000000) + 'SCLH';
    return {
      status: 200,
      statusText: 'OK',
      durationMs,
      data: {
        result: {
          TxDirection: 0,
          code: hashMatches ? 0 : -3,
          coreRefNum,
          errorDetails: hashMatches ? 'SUCCESS' : 'INVALID_HASH',
          payerAccountNo: '0001******4504',
          transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          xTran: {
            txid: '261112080907751',
            purchaseAmount: 4000,
            purchaseCurrency: 'KHR',
            purchaseDate: Date.now() - 60000,
            purchaseDesc: 'mobile',
            invoiceid: '261112080907751',
            quantity: 0,
            paymentTokenid,
            expiryTime: 5,
            confirmDate: Date.now(),
            purchaseType: 0,
            feeAmount: 0,
            operationType: 0,
          },
          customerName: 'KIMLLOANG TESTER',
          mobileRef: 'REF_' + Date.now().toString().slice(-6),
          paymentMethod: 'acledapay',
        },
      },
      headers,
      isSimulated: true,
      notes: 'Simulated successful paid settlement (code 0, coreRefNum ' + coreRefNum + ').',
    };
  }

  // 4. Validate Endpoint: refundTxn
  if (endpoint === 'refundTxn') {
    const currency = payload.currency;
    const amount = Number(payload.amount);

    if (currency !== 'USD' && currency !== 'KHR') {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            code: -99,
            status: -1,
          },
        },
        headers,
        isSimulated: true,
        notes: 'Simulated currency mismatch error (-99). Currency must be KHR or USD.',
      };
    }

    if (amount > 1000000) {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            code: -99,
            status: -1,
          },
        },
        headers,
        isSimulated: true,
        notes: 'Simulated amount exceeds refundable balance (-99).',
      };
    }

    if (String(payload.paymentTokenId).includes('UNPAID')) {
      return {
        status: 200,
        statusText: 'OK',
        durationMs,
        data: {
          result: {
            code: 334845,
            message: 'This transaction is not available for refund. Please contact bank!',
            status: -1,
          },
        },
        headers,
        isSimulated: true,
        notes: 'Simulated unpaid transaction refund attempt (code 334845).',
      };
    }

    return {
      status: 200,
      statusText: 'OK',
      durationMs,
      data: {
        result: {
          code: 0,
          message: 'Refund successful',
          status: 0,
          refundDate: Date.now(),
        },
      },
      headers,
      isSimulated: true,
      notes: 'Refund executed successfully (code 0).',
    };
  }

  return {
    status: 404,
    statusText: 'Not Found',
    durationMs,
    data: { error: `Endpoint ${endpoint} not recognized in ACLEDA specification` },
    headers,
    isSimulated: true,
  };
}
