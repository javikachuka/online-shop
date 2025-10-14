

export interface PayPalOrderStatusResponse {
    id:             string;
    status:         string;
    intent:         string;
    payment_source: PaymentSource;
    purchase_units: PurchaseUnit[];
    payer:          Payer;
    create_time:    Date;
    links:          Link[];
}

export interface Link {
    href:   string;
    rel:    string;
    method: string;
}

export interface Payer {
    name:          Name;
    email_address: string;
    payer_id:      string;
}

export interface Name {
    given_name: string;
    surname:    string;
}

export interface PaymentSource {
    paypal: Paypal;
}

export interface Paypal {
    name:          Name;
    email_address: string;
    account_id:    string;
}

export interface PurchaseUnit {
    reference_id: string;
    amount:       Amount;
    invoice_id:   string;
}

export interface Amount {
    currency_code: string;
    value:         string;
}