# Initialize payment (Public)

```ts
curl --location --request POST 'https://d-event-psp.fly.dev/digiteal/initialize-payment' \
--header 'Content-Type: application/json' \
--data-raw '{
    "amountInCents": 4000,
    "confirmationURL": "https://www.url.com/payment-success",
    "errorURL": "https://www.url.com/payment-error",
    "paymentInternalId": "1234",
    "language": "EN",
    "remittanceInfo": "test",
    "backendConfirmationURL": "https://backend.url.com/payment-success",
    "backendErrorURL": "https://backend.url.com/payment-error",
}'
```

- `amountInCents`: amount in cents.
- `confirmationURL`: URL where to redirect the user when payment is confirmed.
- `errorURL`: URL where to redirect the user when payment failed.
- `paymentInternalId`: Internal ID used as a reference throughout the buying process. This should come from D-Event backend.
- `language`: Language of the payement page. Digiteal supports: EN, FR, NL.
- `remittanceInfo`: Communication of the payment.
- `backendConfirmationURL`: Backend endpoint URL to call when payment is confirmed.
- `backendErrorURL`: Backend endpoint URL to call when payment failed.

### Response: (string)

```
https://test.digiteal.eu/#/payment-choice/2104bb7a-af66-431e-b67a-12b1693b7037?language=en
```

This link should be used to redirect the user to the payment page hosted by Digiteal.

# Payment status (Public)

```ts
curl --location --request GET 'https://d-event-psp.fly.dev/digiteal/payment-status' \
--header 'Content-Type: application/json' \
--data-raw '{
    "paymentInternalId": "1234"
}'
```

- `paymentInternalId`: Internal ID used as a reference throughout the buying process.

### Response (object)

```ts
{
    "paymentStatus": null,
    "paymentWebUrl": "https://test.digiteal.eu/#/payment-choice/503ec9f6-22a5-4487-b49e-6dc183f48c4e?language=en"
}
```

- `paymentStatus`:
  - `null`: Not paid.
  - `"INITIATION_ERROR"`: Not paid. Most probably when payment was cancelled.
  - `"INITIATED"`: Paid. This is the status used by Digiteal when payment is confirmed.
- `paymentWebUrl`: URL retrieved when initiating the payment. Can be used for a limited amount of time (10 minutes) while the payment is not yet fulfilled.

# Webhook Config (Private)

> This is a convenient endpoint to configure the webhook address (since Digiteal does not have an UI to perform such operation in their Dashboard). **This is not part of the payment process and should only be used during setup.**

It is protected by a HTTP Basic authentication (login/password) so third-parties can not access it.

```ts
curl --location --request POST 'https://d-event-psp.fly.dev/digiteal/webhook-config' \
--header 'Authorization: Basic d*************=' \
--header 'Content-Type: application/json' \
--data-raw '{
    "webhookUrl": "https://d-event-psp.fly.dev/digiteal/webhook"
}'
```

- `webhookUrl`: URL used by Digiteal to notify payment event.

# Webhook (Digiteal)

It is protected by a HTTP Basic authentication (login/password) so third-parties can not access it.

During the webhook configuration (see previous section), we provide a login/password so we know this is coming from Digiteal.

```ts
curl --location --request POST 'https://d-event-psp.fly.dev/digiteal/webhook' \
--header 'Authorization: Basic d*************=' \
--header 'Content-Type: application/json' \
--data-raw '{
    "originCompanyName": "Customer Unknown",
    "bankTransactionID": "81c689a0-7c87-4e21-a87b-81ef10c4ce21",
    "originFirstName": "Customer",
    "originLastName": "Unknown",
    "paymentRequestInformation": {
        "amountInCents": 4000,
        "paymentInternalId": "1234",
        "requestorID": 29220,
        "purpose": "GDDS",
        "paymentID": "81c689a0-7c87-4e21-a87b-81ef10c4ce21",
        "requestorVAT": "BE0736494076",
        "destinationBankAccount": "BE41068942489110",
        "currency": "EUR",
        "remittanceInfo": "test",
        "paymentRequestDate": "2022-09-21",
        "requestorNationalIdentifier": "BE:VAT:BE0736494076"
    },
    "paymentMethod": "BANCONTACT",
    "targetBankAccount": "BE41068942489110",
    "paymentStatus": "INITIATED",
    "originBankAccount": "BE68539007547034",
    "executionTimestamp": "2022-09-21 20:39:28"
}'
```

See https://docs.digiteal.eu/technical/payment-requester-api.html#/definitions/TransferOfFundsNotification for a full description or the request body.

We target two fields:

- `paymentStatus`: Status of the payment.
- `paymentRequestInformation: { paymentInternalId }`: Internal ID.

Based on the meeting with Cedric (@Digiteal), we only targets two payment statuses:

- `INITIATED`: payment accepted.
- `INITIATION_ERROR`: payment error.

**Payment accepted**

If the payment is accepted, we will call the `backendConfirmationUrl` with a POST request as follow:

```ts
curl --location --request POST 'https://backend.url.com/payment-success' \
--header 'Content-Type: application/json' \
--data-raw '{
    "paymentInternalId": "1234",
    "amountInCents": 4000,
    "paymentStatus": "INITIATED",
}'
```

**Payment failed**

If the payment failed, we will call the `backendErrorUrl` with a POST request as follow:

```ts
curl --location --request POST 'https://backend.url.com/payment-error' \
--header 'Content-Type: application/json' \
--data-raw '{
    "paymentInternalId": "1234",
    "paymentStatus": "INITIATION_ERROR",
}'
```
