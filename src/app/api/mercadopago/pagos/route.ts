import { validateMercadoPagoPayment } from "@/actions";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        
        // level security
        // const signatureHeader = request.headers.get("x-signature") || request.headers.get("x-mp-signature");
        // const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!;
    
        // Calcula la firma HMAC SHA256
        // const expectedSignature = crypto
        //     .createHmac("sha256", secret)
        //     .update(rawBody)
        //     .digest("hex");
    
        // Extrae el valor de v1 del header
        // let receivedSignature = "";
        // if (signatureHeader) {
        //     const match = signatureHeader.match(/v1=([a-f0-9]+)/);
        //     if (match) {
        //         receivedSignature = match[1];
        //     }
        // }
    
        // console.log({ signatureHeader, expectedSignature, receivedSignature });
    
        // if (!receivedSignature || receivedSignature !== expectedSignature) {
        //     return new Response("Invalid signature", { status: 401 });
        // }
    
        const body = JSON.parse(rawBody);
        await validateMercadoPagoPayment(body.data.id);

        
    } catch (error) {
        console.error("Error processing Mercado Pago webhook:", error);
    }

    return new Response(null, { status: 200 });
}